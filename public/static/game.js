var app = new Vue({
	el: '#app',
	data: {
		BOARD_SIZE: 3,
		myTurn: false,
		beforeArea: 0,
		roomCode: '',
		boardData: []
	},
	created() {
		// Init
		this.initBoardData();
		
		// Connect to socket.io
		this.$socket = io();
		
		// Join room
		let urlPath = window.location.pathname;
		this.roomCode = urlPath.substring(1, urlPath.length);
		this.$socket.emit('join room', this.roomCode);
		
		// Chat Message
		this.$socket.on('chat message', (id, msg) => {
			// Check who send it
			if (id === this.$socket.id)
				$('#messages').append($(`<li><span class='badge badge-primary'>Your</span> : ${msg}</li>`));
			else
				$('#messages').append($(`<li><span class='badge badge-brown'>Enemy</span> : ${msg}</li>`));
		})
		
		// Board Click
		this.$socket.on('board click', (msg) => {
			$('#messages').append($('<li>').text(msg));
			
			// Save board data
			this.writeBoardData(msg);
			
			// Show system message and who's owner about board
			if (this.myTurn) {
				$('#' + msg).addClass('btn-primary');
				this.enemyTurnMsg();
			} else {
				$('#' + msg).addClass('btn-brown');
				this.myTurnMsg();
			}
			
			// Remove before board-area targeting animation
			if (this.beforeArea !== 0)
				$('#board-area-' + this.beforeArea).removeClass((this.myTurn ? 'my' : 'enemy') + '-targeting');
			
			// Show current board-area targeting animation
			this.beforeArea = msg.substring(3,4);
			$('#board-area-' + this.beforeArea).addClass((this.myTurn ? 'enemy' : 'my')+'-targeting');
			
			// Disabled for non-target board-area
			for (let i = 1; i < this.BOARD_SIZE * this.BOARD_SIZE + 1; i++) {
				if (Number(this.beforeArea) !== i) {
					$('#board-area-' + i).addClass('disabled');
				} else {
					$('#board-area-' + i).removeClass('disabled');
				}
			}
			
			// Now change turn
			this.myTurn = !this.myTurn;
		});
		
		// Game Start
		this.$socket.on('game start', (firstSocketId) => {
			$('#messages').append($('<li class="system-msg">').text('Game Start !'));
			if (firstSocketId === this.$socket.id) {
				this.myTurn = true;
				this.myTurnMsg();
			} else {
				this.myTurn = false;
				this.enemyTurnMsg();
			}
		});
		
		// Out room (Called when the room is full)
		this.$socket.on('out room', () => {
			window.location.href = '/';
		})
	},
	methods: {
		/**
		 * initBoardData
		 * @desc : Init Board Data
		 */
		initBoardData() {
			for (var i = 0; i < this.BOARD_SIZE * this.BOARD_SIZE; i++) {
				this.boardData[i] = {
					'owner': undefined,
					'boards': {}
				}
				for (var n = 1; n < this.BOARD_SIZE+1; n++) {
					for (var m = 1; m < this.BOARD_SIZE+1; m++) {
						this.boardData[i].boards[n + ':' + m] = undefined;
					}
				}
			}		
			console.log(this.boardData);
		},
		/**
		 * boardClick
		 * @desc : Click board event func
		 * @param packet : board data packet
		 */
		boardClick(packet) {
			this.$socket.emit('board click', packet);
			$('#m').val('');
		},
		/**
		 * getBoardAreaNum
		 * @desc : Get board-area(big board) inherence index num
		 * @param n : pos-y
		 * @param m : pos-x
		 */
		getBoardAreaNum(n, m) {
			return (n - 1) * this.BOARD_SIZE + m;
		},
		/**
		 * chatSubmit
		 * @desc : Chatting submit event func
		 * @param msg : chatting message(not used)
		 */
		chatSubmit(msg) {
			this.$socket.emit('chat message', this.roomCode, $('#m').val());
			$('#m').val('');
		},
		/**
		 * myTurnMsg
		 * @desc : System Message about notice 'your turn'
		 */
		myTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-primary">your</span> Turn !</li>'));
		},
		/**
		 * enemyTurnMsg
		 * @desc : System Message about notice 'enemy turn'
		 */
		enemyTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-brown">enemy</span> Turn !</li>'));
		},
		/**
		 * writeBoardData
		 * @desc : Write Board data about who's owner about board (who clicked it)
		 * @param bPos : board position data
		 */
		writeBoardData(bPos) {
			let boardAreaNum = Number(bPos.substr(0, 1)) - 1;
			let n = Number(bPos.substr(1, 1));
			let m = Number(bPos.substr(2, 1));
			this.boardData[boardAreaNum].boards[n+':'+m] = this.myTurn ? 'ME' : 'ENEMY';
			this.checkBoardOwner(boardAreaNum, n, m);
		},
		/**
		 * checkBoardOwner
		 * @desc : Check Who is owner about board-area
		 * @param boardAreaNum : board-area index
		 * @param n : pos-y
		 * @param m : pos-x
		 */
		checkBoardOwner(boardAreaNum, n, m) {
			let countMyBlock = 0;
			for (let i = 1; i < this.BOARD_SIZE+1; i++) {
				// Horizontal Check
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE+1; j++) {
					if (this.boardData[boardAreaNum].boards[i+':'+j] === 'ME')
						countMyBlock++;
					else break;
				}
				
				// Check if it is finished
				if (countMyBlock === this.BOARD_SIZE)
					break;
				
				// Vertical Check
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE+1; j++) {
					if (this.boardData[boardAreaNum].boards[j+':'+i] === 'ME')
						countMyBlock++;
					else break;
				}
				
				// Check if it is finished
				if (countMyBlock === this.BOARD_SIZE)
					break;
			}
			
			// If board is finished. board-area(big board) is mine.
			if (countMyBlock === this.BOARD_SIZE) {
				this.boardData[boardAreaNum].owner = 'ME';
				$('#messages').append($('<li class="system-msg">').text(boardAreaNum + ' is done.'));
			}
		}
	}
})
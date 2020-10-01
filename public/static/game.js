var app = new Vue({
	el: '#app',
	data: {
		BOARD_SIZE: 3,
		myTurn: false,
		beforeArea: 0,
		roomCode: '',
		boardData: [],
		responsiveChat: true
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
			$('#messages').scrollTop($('#messages').height());
		})
		
		// Board Click
		this.$socket.on('board click', (msg) => {
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
			else
				$('#game-col').removeClass((this.myTurn ? 'my' : 'enemy')+'-targeting');
			
			this.beforeArea = msg.substring(3,4);
			if (this.boardData[Number(this.beforeArea)-1].owner === undefined) {
				// Show current board-area targeting animation
				$('#board-area-' + this.beforeArea).addClass((this.myTurn ? 'enemy' : 'my')+'-targeting');

				// Disabled for non-target board-area
				for (let i = 1; i < this.BOARD_SIZE * this.BOARD_SIZE + 1; i++) {
					if (Number(this.beforeArea) !== i) {
						$('#board-area-' + i).addClass('disabled');
					} else {
						$('#board-area-' + i).removeClass('disabled');
					}
				}
			} else {
				this.beforeArea = 0;
				$('#game-col').addClass((this.myTurn ? 'enemy' : 'my')+'-targeting');
				// Open all board-area except where the owner has.
				for (let i = 1; i < this.BOARD_SIZE * this.BOARD_SIZE + 1; i++) {
					if (this.boardData[i-1].owner === undefined) {
						$('#board-area-' + i).removeClass('disabled');
					}
				}
			}
			
			// Now change turn
			this.myTurn = !this.myTurn;
		});
		
		// Game Start
		this.$socket.on('game start', (firstSocketId) => {
			$('#messages').append($('<li class="system-msg">').text('<===    Game Start    ===>'));
			$('#messages').scrollTop($('#messages').height());
			if (firstSocketId === this.$socket.id) {
				this.myTurn = true;
				this.myTurnMsg();
				$('#game-col').addClass((this.myTurn ? 'my' : 'enemy')+'-targeting');
			} else {
				this.myTurn = false;
				this.enemyTurnMsg();
			}
		});
		
		// Game End
		this.$socket.on('game end', () => {
			$('#board-area-' + this.beforeArea).removeClass((this.myTurn ? 'my' : 'enemy') + '-targeting');
			$('#game-col').removeClass((this.myTurn ? 'my' : 'enemy')+'-targeting');
			this.myTurn = false;
			this.systemMsg('<================>');
		});
		
		// Enemy has left
		this.$socket.on('leave enemy', () => {
			this.systemMsg('<===    GAME END    ===>');
			this.systemMsg('The Enemy has left !!');
			$('#messages').append($('<li class="system-msg"><span class="badge badge-primary">your</span> win !</li>'));
			$('#messages').scrollTop($('#messages').height());
			
			$('#board-area-' + this.beforeArea).removeClass((this.myTurn ? 'my' : 'enemy') + '-targeting');
			$('#game-col').removeClass((this.myTurn ? 'my' : 'enemy')+'-targeting');
			this.myTurn = false;
		})
		
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
			this.$socket.emit('chat message', $('#m').val());
			$('#m').val('');
		},
		/**
		 * myTurnMsg
		 * @desc : System Message about notice 'your turn'
		 */
		myTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-primary">your</span> Turn !</li>'));
			$('#messages').scrollTop($('#messages').height());
		},
		/**
		 * enemyTurnMsg
		 * @desc : System Message about notice 'enemy turn'
		 */
		enemyTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-brown">enemy</span> Turn !</li>'));
			$('#messages').scrollTop($('#messages').height());
		},
		/**
		 * systemMsg
		 * @desc : System Message
		 * @param msg : message content
		 */
		systemMsg(msg) {
			$('#messages').append($('<li class="system-msg">').text(msg));
			$('#messages').scrollTop($('#messages').height());
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
			console.log(this.boardData);
		},
		/**
		 * checkBoardOwner
		 * @desc : Check Who is owner about board-area
		 * @param boardAreaNum : board-area index
		 * @param n : pos-y
		 * @param m : pos-x
		 */
		checkBoardOwner(boardAreaNum, n, m) {
			let owner = this.myTurn ? 'ME' : 'ENEMY';
			let countMyBlock = 0;
			for (let i = 1; i < this.BOARD_SIZE+1; i++) {
				// Horizontal Check
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE+1; j++) {
					if (this.boardData[boardAreaNum].boards[i+':'+j] === owner) countMyBlock++;
					else break;
				}
				
				// Check if it is finished
				if (countMyBlock === this.BOARD_SIZE) break;
				
				// Vertical Check
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE+1; j++) {
					if (this.boardData[boardAreaNum].boards[j+':'+i] === owner) countMyBlock++;
					else break;
				}
				
				// Check if it is finished
				if (countMyBlock === this.BOARD_SIZE) break;
			}
			
			// Diagonal check (+,+)
			if (countMyBlock !== this.BOARD_SIZE) {
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE+1; j++) {
					if (this.boardData[boardAreaNum].boards[j+':'+j] === owner) countMyBlock++;
					else break;
				}
			}
			// Diagonal check (-,-)
			if (countMyBlock !== this.BOARD_SIZE) {
				countMyBlock = 0;
				for (let j = 1; j < this.BOARD_SIZE +1; j++) {
					if (this.boardData[boardAreaNum].boards[j+':'+(this.BOARD_SIZE-j+1)] === owner) countMyBlock++;
					else break;
				}
			}
			
			// If board is finished. board-area(big board) is mine.
			if (countMyBlock === this.BOARD_SIZE) {
				$('#board-area-' + (boardAreaNum + 1)).addClass('done');
				this.boardData[boardAreaNum].owner = owner;
				$('#messages').append($('<li class="system-msg">').text(boardAreaNum + 1 + '\s block is done.'));
				$('#messages').scrollTop($('#messages').height());
				this.checkWinner(owner);
			}
			
			// Check no one can't get board-area
			countMyBlock = true;
			for (let prop in this.boardData[boardAreaNum].boards) {
				if (this.boardData[boardAreaNum].boards[prop] === undefined) {
					countMyBlock = false;
					break;
				}
			}
			if (countMyBlock) {
				$('#board-area-' + (boardAreaNum + 1)).addClass('done');
				this.boardData[boardAreaNum].owner = 'NOONE';
				$('#messages').append($('<li class="system-msg">').text(boardAreaNum + 1 + '\s block is no-one.'));
				$('#messages').scrollTop($('#messages').height());
				this.checkWinner(owner);
			}
		},
		/**
		 * checkWinner
		 * @desc : Check Who is winner
		 * @param boardAreaNum : board-area index
		 * @param n : pos-y
		 * @param m : pos-x
		 */
		checkWinner(owner) {
			let countBoardOwner = 0;
			for (let i = 0; i < this.BOARD_SIZE; i++) {
				// Horizontal Check
				for (let j = 0; j < this.BOARD_SIZE; j++) {
					if (this.boardData[(i * this.BOARD_SIZE) + j].owner === owner) countBoardOwner++;
					else break;
				}
				if (countBoardOwner === this.BOARD_SIZE) {
					this.gameEnd();
					return;
				}
				
				// Vertical Check
				countBoardOwner = 0;
				for (let j = 0; j < this.BOARD_SIZE; j++) {
					if (this.boardData[i + (j * this.BOARD_SIZE)].owner === owner) countBoardOwner++;
					else break;
				}
				if (countBoardOwner === this.BOARD_SIZE) {
					this.gameEnd();
					return;
				}
			}
			
			// Diagonal check (+,+)
			countBoardOwner = 0;
			for (let i = 0; i < this.BOARD_SIZE; i++) {
				if (this.boardData[0 + (i * (this.BOARD_SIZE+1))].owner === owner) countBoardOwner++;
				else break;
			}
			if (countBoardOwner === this.BOARD_SIZE) {
				this.gameEnd();
				return;
			}
			
			// Diagonal check (-,-)
			countBoardOwner = 0;
			for (let i = 0; i < this.BOARD_SIZE; i++) {
				if (this.boardData[(this.BOARD_SIZE-1) + 2 * i].owner === owner) countBoardOwner++;
				else break;
			}
			if (countBoardOwner === this.BOARD_SIZE) {
				this.gameEnd();
				return;
			}
			
			// Check is it draw
			for (let i = 0; i < this.BOARD_SIZE * this.BOARD_SIZE; i++) {
				if (this.boardData[i].owner !== undefined) return;
			}
			this.drawEnd();
		},
		/**
		 * gameEnd
		 * @desc : Game End
		 */
		gameEnd() {
			this.$socket.emit('game end');
			this.systemMsg('<=== GAME END ===>');
			
			if (this.myTurn)
				$('#messages').append($('<li class="system-msg"><span class="badge badge-primary">your</span> win !</li>'));
			else
				$('#messages').append($('<li class="system-msg"><span class="badge badge-brown">enemy</span> win !</li>'));
			$('#messages').scrollTop($('#messages').height());
		},
		/**
		 * drawEnd
		 * @desc : Draw End
		 */
		drawEnd() {
			this.$socket.emit('game end');
			this.systemMsg('<=== GAME END ===>');
			
			$('#messages').append($('<li class="system-msg"><span class="badge badge-info">Draw</span> !!!</li>'));
			$('#messages').scrollTop($('#messages').height());
		},
		/**
		 * copyUrl
		 * @desc : Copy Url clipboard
		 */
		copyUrl() {
			var dummy = document.createElement('input');
			var text = window.location.href;

			document.body.appendChild(dummy);
			dummy.value = text;
			dummy.select();
			document.execCommand('copy');
			document.body.removeChild(dummy);
		}
	}
})

var app = new Vue({
	el: '#app',
	data: {
		BOARD_SIZE: 3,
		isGameEnd: false,
		myTurn: false,
		beforeArea: 0,
		roomCode: '',
		boardData: [],
		responsiveChat: true,
		isGameColTarget: false,		// game-col targeting (all active)
		targetArea: -1				// target-area
	},
	computed: {
		boardOwner() {
			return (i, n, m) => {
				if (this.boardData[i-1].boards[n+':'+m] === 'ME')
					return 'btn-primary';
				else if (this.boardData[i-1].boards[n+':'+m] === 'ENEMY')
					return 'btn-brown';
				return '';
			}
		},
		boardAreaOwner() {
			return (i) => {
				if (this.boardData[i-1].owner !== undefined)
					return 'done';
				return '';
			}
		},
		gameColTargeting() {
			return () => {
				if (this.isGameColTarget)
					return (this.myTurn ? 'my' : 'enemy')+'-targeting';
				return '';
			}
		},
		boardActive() {
			return (i) => {
				if (this.targetArea === -1 || this.targetArea == i)
					return 'active';
				return '';
			}
		},
		boardTargeting() {
			return (i) => {
				if (!this.isGameColTarget && this.targetArea == i)
					return (this.myTurn ? 'my' : 'enemy')+'-targeting';
				return '';
			}
		}
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
		this.$socket.on('board click', (boardData) => {
			// Save board data
			this.writeBoardData(boardData);
			
			// Check Board Owner to send boardAreaNum
			if (!this.checkBoardOwner(Number(boardData.substr(0, 1)) - 1)) {
				// Game is not end
				if (this.myTurn) {
					this.enemyTurnMsg();
				} else {
					this.myTurnMsg();
				}
			}
			
			// Remove before board-area targeting animation
			if (this.beforeArea === 0)
				this.isGameColTarget = false;
			
			this.beforeArea = boardData.substring(3,4);
			if (this.boardData[Number(this.beforeArea)-1].owner === undefined) {
				// Show current board-area targeting animation
				this.targetArea = this.beforeArea;
			} else {
				// Open all board-area except where the owner has.
				this.beforeArea = 0;
				this.isGameColTarget = true;
				this.targetArea = -1;
			}
			
			// Now change turn
			this.myTurn = !this.myTurn;
			console.log(this.boardData);
		});
		
		// Game Start
		this.$socket.on('game start', (firstPlayerId) => {
			this.gameStart(firstPlayerId);
		});
		
		// Game End
		this.$socket.on('game end', () => {
			this.gameEndData();
		});
		
		// Replay Game
		this.$socket.on('replay', (firstPlayerId) => {
			this.gameStart(firstPlayerId);
		})
		
		// Enemy has left
		this.$socket.on('leave enemy', () => {
			this.systemMsg('<===    GAME END    ===>');
			this.systemMsg('The Enemy has left !!');
			$('#messages').append($('<li class="system-msg"><span class="badge badge-primary">your</span> win !</li>'));
			
			this.gameEndData();
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
			this.beforeArea = 0;
			this.responsiveChat = true;
			this.isGameColTarget = false;
			this.targetArea = -1;
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
		 * gameStart
		 * @desc : Game Start Data setting
		 * @param firstPlayerId : who is first play ($socket.id)
		 */
		gameStart(firstPlayerId) {
			this.isGameEnd = false;
			this.initBoardData();
			
			$('#messages').append($('<li class="system-msg">').text('<===    Game Start    ===>'));
			$('#messages').scrollTop($('#messages').height());
			if (firstPlayerId === this.$socket.id) {
				this.myTurn = true;
				this.myTurnMsg();
				this.isGameColTarget = true;
			} else {
				this.myTurn = false;
				this.enemyTurnMsg();
			}
			this.isGameColTarget = true;
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
			let n = bPos.substr(1, 1);
			let m = bPos.substr(2, 1);
			this.boardData[boardAreaNum].boards[n+':'+m] = this.myTurn ? 'ME' : 'ENEMY';
		},
		/**
		 * checkBoardOwner
		 * @desc : Check Who is owner about board-area
		 * @param boardAreaNum : board-area index
		 * @param n : pos-y
		 * @param m : pos-x
		 */
		checkBoardOwner(boardAreaNum) {
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
				this.boardData[boardAreaNum].owner = owner;
				$('#messages').append($('<li class="system-msg">').text(boardAreaNum + 1 + '\s block is done.'));
				$('#messages').scrollTop($('#messages').height());
				return this.checkWinner(owner);
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
				this.boardData[boardAreaNum].owner = 'NOONE';
				$('#messages').append($('<li class="system-msg">').text(boardAreaNum + 1 + '\s block is no-one.'));
				$('#messages').scrollTop($('#messages').height());
				return this.checkWinner(owner);
			}
			return false;
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
				countBoardOwner = 0;
				for (let j = 0; j < this.BOARD_SIZE; j++) {
					if (this.boardData[(i * this.BOARD_SIZE) + j].owner === owner) countBoardOwner++;
					else break;
				}
				if (countBoardOwner === this.BOARD_SIZE) {
					this.gameEnd();
					console.log('1');
					return true;
				}
				
				// Vertical Check
				countBoardOwner = 0;
				for (let j = 0; j < this.BOARD_SIZE; j++) {
					if (this.boardData[i + (j * this.BOARD_SIZE)].owner === owner) countBoardOwner++;
					else break;
				}
				if (countBoardOwner === this.BOARD_SIZE) {
					this.gameEnd();
					console.log('2');
					return true;
				}
			}
			
			// Diagonal check (+,+)
			countBoardOwner = 0;
			for (let i = 0; i < this.BOARD_SIZE; i++) {
				// i 0
				// 0
				// i 1
				// 4
				// i 2
				// 8
				if (this.boardData[i * (this.BOARD_SIZE+1)].owner === owner) countBoardOwner++;
				else break;
			}
			if (countBoardOwner === this.BOARD_SIZE) {
				this.gameEnd();
					console.log('3');
				return true;
			}
			
			// Diagonal check (-,-)
			countBoardOwner = 0;
			for (let i = 0; i < this.BOARD_SIZE; i++) {
				if (this.boardData[(this.BOARD_SIZE-1) + 2 * i].owner === owner) countBoardOwner++;
				else break;
			}
			if (countBoardOwner === this.BOARD_SIZE) {
				this.gameEnd();
					console.log('4');
				return true;
			}
			
			// Check is it draw
			for (let i = 0; i < this.BOARD_SIZE * this.BOARD_SIZE; i++) {
				if (this.boardData[i].owner === undefined) return false;
			}
			this.drawEnd();
			return true;
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
			this.isGameEnd = true;
		},
		/**
		 * gameEndData
		 * @desc : setting data on game append
		 */
		gameEndData() {
			this.isGameEnd = true;
			this.targetArea = -1;
			this.isGameColTarget = false;
			this.myTurn = false;
			this.systemMsg('<================>');
		},
		/**
		 * drawEnd
		 * @desc : Draw End
		 */
		drawEnd() {
			this.$socket.emit('game end');
			this.systemMsg('<=== GAME END ===>');
			
			$('#messages').append($('<li class="system-msg"><span class="badge badge-info">Draw</span> !!!</li>'));
			this.isGameEnd = true;
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
		},
		/**
		 * replayBtn
		 * @desc : Replay
		 */
		replayBtn() {
			this.$socket.emit('replay', this.roomCode);
		}
	}
})
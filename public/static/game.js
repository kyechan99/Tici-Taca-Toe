var app = new Vue({
	el: '#app',
	data: {
		BOARD_SIZE: 3,
		myTurn: false,
		beforeArea: 0,
		roomCode: '',
	},
	created() {
		this.$socket = io();
		
		let urlPath = window.location.pathname;
		this.roomCode = urlPath.substring(1, urlPath.length)
		console.log(this.roomCode);
		
		this.$socket.emit('joinRoom', this.roomCode);
		// this.$socket.join(this.roomCode);
		// console.log(this.$socket.sockets.clients(this.roomCode));
		
		
		this.$socket.on('chat message', (id, msg) => {
			if (id === this.$socket.id)
				$('#messages').append($(`<li><span class='badge badge-primary'>Your</span> : ${msg}</li>`));
			else
				$('#messages').append($(`<li><span class='badge badge-brown'>Enemy</span> : ${msg}</li>`));
		})
		this.$socket.on('system message', (msg) => {
			$('#messages').append($('<li>').text(msg));
		})
		this.$socket.on('boardClick', (msg) => {
			$('#messages').append($('<li>').text(msg));
			
			if (this.myTurn) {
				$('#' + msg).addClass('btn-primary');
				this.enemyTurnMsg();
			} else {
				$('#' + msg).addClass('btn-brown');
				this.myTurnMsg();
			}
			
			if (this.beforeArea !== 0)
				$('#board-area-' + this.beforeArea).removeClass((this.myTurn ? 'my' : 'enemy')+'-targeting');
			
			this.beforeArea = msg.substring(3,4);
			$('#board-area-' + this.beforeArea).addClass((this.myTurn ? 'enemy' : 'my')+'-targeting');
			for (let i = 1; i < this.BOARD_SIZE * this.BOARD_SIZE + 1; i++) {
				console.log(i);
				if (Number(this.beforeArea) !== i) {
					$('#board-area-' + i).addClass('disabled');
				} else {
					$('#board-area-' + i).removeClass('disabled');
				}
			}
			this.myTurn = !this.myTurn;
		});
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
		this.$socket.on('outroom', () => {
			window.location.href = '/';
		})
	},
	methods: {
		boardClick(msg) {
			this.$socket.emit('boardClick', msg);
			$('#m').val('');
		},
		boardAreaNum(n, m) {
			return (n - 1) * this.BOARD_SIZE + m;
		},
		chatSubmit(msg) {
			this.$socket.emit('chat message', this.roomCode, $('#m').val());
			$('#m').val('');
		},
		myTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-primary">your</span> Turn !</li>'));
		},
		enemyTurnMsg() {
			$('#messages').append($('<li class="system-msg">Now <span class="badge badge-brown">enemy</span> Turn !</li>'));
		}
	}
})
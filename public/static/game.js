var app = new Vue({
	el: '#app',
	data: {
		BOARD_SIZE: 3,
		myName: 'U0',
		myTurn: true,
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
		
		
		this.$socket.on('chat message', (msg)=> {
			$('#messages').append($('<li>').text(this.$socket.id + msg));
		})
		this.$socket.on('boardClick', (msg) => {
			$('#messages').append($('<li>').text(msg));
			$('#' + msg).removeClass('btn-primary');
			$('#' + msg).addClass('btn-brown');
			if (this.beforeArea !== 0) {
				$('#board-area-' + this.beforeArea).removeClass('targeting');
			}
			this.beforeArea = msg.substring(3,4);
			$('#board-area-' + this.beforeArea).addClass('targeting');
			for (let i = 1; i < this.BOARD_SIZE * this.BOARD_SIZE + 1; i++) {
				console.log(i);
				if (Number(this.beforeArea) !== i) {
					$('#board-area-' + i).addClass('disabled');
				} else {
					$('#board-area-' + i).removeClass('disabled');
				}
			}
		});
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
		}
  }
})
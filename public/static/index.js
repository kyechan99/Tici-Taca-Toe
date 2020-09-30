var app = new Vue({
	el: '#app',
	data: {
		myName: 'U0',
	},
	created() {
	},
	methods: {
		generateRandomRoomCode() {
			var letters = '0123456789ABCDEF';
			var roomCode = '';
			for (var i = 0; i < 6; i++) {
			  roomCode += letters[Math.floor(Math.random() * 16)];
			}
			return roomCode;
		}
	}
})
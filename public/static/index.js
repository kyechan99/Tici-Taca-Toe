$(function () {
    var socket = io();
	let beforeArea = 0;
    $('form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
    });
    socket.on('boardClick', function(msg){
      $('#messages').append($('<li>').text(msg));
		$('#' + msg).removeClass('btn-primary');
		$('#' + msg).addClass('btn-brown');
		if (beforeArea !== 0) {
			$('#board-area-' + beforeArea).removeClass('targeting');
			// $('#board-area-' + beforeArea).removeClass('disabled');
		}
		beforeArea = msg.substring(3,4);
		$('#board-area-' + beforeArea).addClass('targeting');
				// $('#board-area-' + i).removeClass('disabled');
		for (let i = 1; i < 10; i++) {
			if (Number(beforeArea) !== i) {
				$('#board-area-' + i).addClass('disabled');
			} else {
				$('#board-area-' + i).removeClass('disabled');
			}
		}
		// beforeArea = msg.substring(3,4);
		// console.log(msg.substring(3,4));
    });
});
var app = new Vue({
  el: '#app',
  data: {
	BOARD_SIZE: 3,
    message: '안녕하세요 Vue!',
	myTurn: true
  },
	created() {
		this.$socket = io();
		this.$socket.on('chat', (data)=> { this.textarea += data.message + "\n" })
	},
  methods: {
	  boardClick(msg) {
		this.$socket.emit('boardClick', msg);
		$('#m').val('');
	  },
	  boardAreaNum(n, m) {
		  return (n - 1) * this.BOARD_SIZE + m;
	  }
  }
})
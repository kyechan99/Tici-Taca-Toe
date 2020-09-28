$(function () {
    var socket = io();
    $('form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });
    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
    });
});

var app = new Vue({
  el: '#app',
  data: {
	BOARD_SIZE: 3,
    message: '안녕하세요 Vue!',
	  socket: ''
  },
	created() {
		this.socket = io();
	},
  methods: {
	  boardClick(msg) {
		this.socket.emit('chat message', msg);
		$('#m').val('');
	  }
  }
})
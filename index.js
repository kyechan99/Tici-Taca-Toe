var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});
app.get('/:roomCode', (req, res) => {
	res.sendFile(__dirname + '/game.html');
});

io.on('connection', (socket) => {
	socket.broadcast.emit('hi');
	console.log(socket.id + ' user connected');
	
	socket.on('joinRoom', (roomCode) => {
		socket.join(roomCode);
		console.log(socket.id + ' join in ' + roomCode);
		// socket.sockets.clients(roomCode);io.sockets.clients('room');
		// console.log(roomCode + ' users :  ' + io.sockets.clients(roomCode));
	});
	socket.on('chat message', (roomCode, msg) => {
		console.log('message: ' + msg);
		io.to(roomCode).emit('chat message', msg);
	});
	socket.on('boardClick', (msg) => {
		console.log('boardClick: ' + msg);
		io.emit('boardClick', msg);
	});
	socket.on('disconnect', function() {
		console.log(socket.id + ' disconnected..');
	});
});


http.listen(3000, () => {
	console.log('listening on *:3000');
});

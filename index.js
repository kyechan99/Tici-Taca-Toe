var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	socket.broadcast.emit('hi');
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		console.log('message: ' + msg);
		io.emit('chat message', msg);
	});
	socket.on('boardClick', (msg) => {
		console.log('boardClick: ' + msg);
		io.emit('boardClick', msg);
	});
});

http.listen(3000, () => {
	console.log('listening on *:3000');
});

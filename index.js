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
	
	socket.on('join room', (roomCode) => {
		io.of('/').in(roomCode).clients((err, clients) => {
			if (clients.length < 2) {
				socket.join(roomCode);
				socket.roomCode = roomCode;
				console.log(socket.id + ' join in ' + roomCode);
				
				if (clients.length > 0) {
					// Who is first? random
					let random = Math.floor(Math.random() * 2);
					if (random === 0)
						io.to(roomCode).emit('game start', clients[0]);
					else
						io.to(roomCode).emit('game start', socket.id);
				}
			} else {
				// Full Memeber
				io.to(socket.id).emit('out room');
			}
			console.log(clients);
		});
	});
	socket.on('chat message', (roomCode, msg) => {
		console.log('message: ' + msg);
		io.to(roomCode).emit('chat message', socket.id, msg);
	});
	socket.on('board click', (msg) => {
		console.log('boardClick: ' + msg);
		io.emit('board click', msg);
	});
	socket.on('disconnect', function() {
		console.log(socket.roomCode);
		io.of('/').in(socket.roomCode).clients((err, clients) => {
			for (let i = 0; i < clients.length; i++) {
				if (clients[i] !== socket.id) {
					io.to(clients[i]).emit('leave enemy');
				}
			}
		});
		console.log(socket.id + ' disconnected..');
	});
});


http.listen(3000, () => {
	console.log('listening on *:3000');
});

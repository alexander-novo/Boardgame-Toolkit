const mongoose = require('mongoose');
const User = mongoose.model('User');
const Project = mongoose.model("Project");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret } = require('../jwt');

let publicLobbies = [];
let privateLobbies = [];
let io;

module.exports.configureSocketIo = function (_io) {
	io = _io;

	io.use((socket, next) => {
		const token = socket.handshake.auth.jwt;

		jwt.verify(token, jwtSecret, { algorithms: ['HS512'] }, (err, { id }) => {
			if (err) {
				return next(err);
			}

			const roomInfo = socket.handshake.auth.roomInfo;
			let lobby;

			if (roomInfo.public && roomInfo.index < publicLobbies.length) {
				lobby = publicLobbies[roomInfo.index];
			} else if (!roomInfo.public && roomInfo.index < privateLobbies.length) {
				lobby = privateLobbies[roomInfo.index];
			} else {
				return next(new Error('Lobby not found'));
			}

			if (!lobby || lobby.roomInfo.id != roomInfo.id)
				return next(new Error('Lobby not found'));

			if (lobby.players >= lobby.maxPlayers)
				return next(new Error('Lobby full'));
			else
				lobby.players++;

			User.findById(id).lean().then(user => {
				socket.data.user = user;
				socket.data.lobby = lobby;
				socket.join(lobby.roomInfo.id);
				next();
			}).catch(next);
		});
	});

	io.on('connection', async (socket) => {
		const roomId = socket.data.lobby.roomInfo.id;
		socket.to(roomId).emit('new player', socket.data.user.username);

		const sockets = await io.in(roomId).fetchSockets();
		socket.emit('players in lobby', sockets.map(sock => sock.data.user.username));

		socket.on('disconnecting', () => {
			socket.in(roomId).emit('player left', socket.data.user.username);
			socket.data.lobby.players--;
		});

		socket.on('chat', content => {
			socket.in(roomId).emit('chat', content);
		});
	});
};

module.exports.newLobby = async (req, res) => {
	let user;
	let project;

	try {
		user = await User.findById(req.user.id);
	} catch (err) {
		res.status(500).json(err);
		return;
	}

	try {
		project = await Project.findById(req.body.projectId);
	} catch (err) {
		res.status(500).json(err);
		return;
	}

	let roomInfo = {
		id: crypto.randomBytes(16).toString('hex'),
		public: req.body.public,
		index: (req.body.public ? publicLobbies.length : privateLobbies.length),
	};

	let newLobby = {
		roomInfo,
		owner: user.username,
		game: {
			name: project.name,
		},
		maxPlayers: req.body.maxPlayers,
		players: 0,
		name: req.body.name,
		mode: 'lobby',
	};

	if (req.body.public) {
		publicLobbies.push(newLobby);
	} else {
		privateLobbies.push(newLobby);
	}

	res.status(200).json(roomInfo);
}

module.exports.listLobbies = async (req, res) => {
	res.status(200).json(publicLobbies);
}
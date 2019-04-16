// Import
const express = require('express');
const proc = require('child_process');
const serveIndex = require('serve-index');
const Eris = require('eris');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

const app = express();
const client = new Eris(config.token);
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Load express
app.use(express.static(__dirname));
app.get('/', (req, res) => {
	res.sendFile(__dirname + `/index.html`);
});
app.use('/server', serveIndex(path.dirname(config.path), { icons: true }), (req, res) => {
	res.download(path.dirname(config.path));
});

let server;
let output = '';
let serverStat = false;
let checkData = false;

// Socket.IO
io.on('connection', (s) => {
	console.log(`User connection`);

	setInterval(() => {
		if (!server)
			return s.emit('status', 'offline');
		if (serverStat)
			return s.emit('status', 'online');
		if (!serverStat)
			return s.emit('status', 'offline');
	}, 5e3);

	s.emit('new_connection');

	s.on('got_it', () => {
		if (server) {
      server.stdout.on('data', (data) => {
  			if (data)
  				s.emit('console', data.toString());
  		});
    }
	});

	// Start server
	s.on('start_server', () => {
		if (server)
			return s.emit('fail', 'start_server');

		server = proc.spawn("java", ['-Xms1024M', '-Xmx1024M', '-jar', 'server.jar', 'nogui'], { cwd: path.dirname(config.path) });
		server.stdout.on('data', (data) => {
			if (data) {
				// output += data.toString();
				s.emit('console', data.toString());

				// Chat
				let playerJoined = data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+)\[\/([\d.:]+)\] logged in/);
				let playerLeft = data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+) lost connection/);
				let chat = data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: <(\w+)> (.*)/i);
				let achivment = data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+) has made the advancement \[([\w\s]+)\]/);

				if (playerJoined)
					return client.createMessage('567492955179319315', `✅ **${playerJoined[1]}** joined the game!`);
				if (playerLeft)
					return client.createMessage('567492955179319315', `❌ **${playerLeft[1]}** left the game!`);
				if (chat)
					return client.createMessage('567492955179319315', `<**${chat[1]}**> ${chat[2]}`);
				if (achivment) {
					return client.createMessage('567492955179319315', `🏅 **${achivment[1]}** has made the advancement \`${achivment[2]}\``);
				}

				if (data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: Stopping server/))
					return serverStat = false;
				else if (data.toString().match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: Done/))
					return serverStat = true;
			}
		});

		client.on('messageCreate', (msg) => {
			if (msg.channel.id !== '567492955179319315' || msg.author.bot || msg.cleanContent.indexOf('-i') >= 0)
				return;

			if (server)
				return server.stdin.write(`tellraw @a ["",{"text":"["},{"text":"${msg.author.username}","color":"light_purple"},{"text":"]","color":"none"},{"text":" ${msg.cleanContent}","color":"none"}]\r`);

		});
		// Exit
		server.on('exit', () => {
			server = null;
			serverStat = false;
		});
	});

	// Get World
	s.on('get_world', () => {
		s.emit('world', `http://localhost/server`);
	});

	// Stop
	s.on('stop_server', () => {
		if (!server)
			return s.emit('fail', 'stop_server');
		server.stdin.write('save-all\r');
		setTimeout(() => {
			server.stdin.write('stop\r');
			setTimeout(() => {
				server = null;
				serverStat = false;
			}, 15e2);
		}, 3e3);
	});

	// Handle commands
	s.on('command', (c) => {
		if (!server)
			return s.emit('fail', c);

		s.emit('command', c);
		server.stdin.write(c + '\r');

	});

});

process.stdin.resume();
process.stdin.on('data', (data) => {
	if (server)
		server.stdin.write(data);
});

// Setup web server
http.listen(config.port, () => console.log(`App listening on port ${config.port}`));
// Discord
client.on('ready', () => console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`));

client.connect();

const socket = io.connect('http://localhost:80', {
	'reconnection': true,
	'reconnectionDelay': 1000,
	'reconnectionDelayMax': 5000,
	'reconnectionAttempts': 5
});

socket.on('console', (line) => {
	let ta = $('#tConsole');

	$('textarea').val($('textarea').val() + line + '\n');
	ta.scrollTop(ta[0].scrollHeight);
});

socket.on('new_connection', () => {
	socket.emit('got_it');
});

socket.on('fail', (f) => {
	alert(`Failed: ${f}`);
});

socket.on('status', (status) => {
	console.log(`GOT EMIT ${status}`);
	if (status == 'online') {
		$('span#statText').text(`ONLINE`).css("color", "#72DA33");
		$('span#statEmote').text(`✅`);
	} else if (status == 'offline') {
		$('span#statText').text(`OFFLINE`).css("color", "#D84C4C");
		$('span#statEmote').text(`⚪`);
	}
});

socket.on('world', (link) => {
	document.location = link;
});

function start() {
	socket.emit(`start_server`);
}

function stop() {
	socket.emit(`stop_server`);
}

// WORLD DOWNLOAD
function restart() {
	socket.emit('get_world');
}

function run(form) {
	let inp = $('form').find('input').val();

	socket.emit('command', inp);

	$('form').find(`input`).val('');
}

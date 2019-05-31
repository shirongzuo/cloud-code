
const io = require('socket.io-client')

var socket = io.connect('http://localhost:5000');
socket.on('new_scan', function (data) {
	console.log(data);
	socket.emit('reader_id', { reader_id: 1 });
});
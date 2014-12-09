var express = require('express');
var app = express();
var http = require('http');
var _io = require('socket.io');
var data = '';

var Rdio = require('node-rdio');
var rdio = new Rdio(["ppebg64vtgcxat45rhrven46", "9YT2zjhE63"]);

var server =http.createServer(app);
var io = _io.listen(server);

server.listen(process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.post('/', function(req, res){

  	req.on('data', function(chunk) {
    	data += chunk;
  	});
	req.on('end', function() {
	    function getQueryVariable(query, variable) {
	        var vars = query.split('&');
	        for (var i = 0; i < vars.length; i++) {
	            var pair = vars[i].split('=');
	            if (decodeURIComponent(pair[0]) == variable) {
	                return decodeURIComponent(pair[1]);
	            }
	        }
	        console.log('Query variable %s not found', variable);
	    }


	    fullstr = getQueryVariable(data,'text');
		string = fullstr.replace('dj:+','');

		if (string.indexOf("play")>=0){
			
			if (string.indexOf("by")>=0) {

			aftertext = string.substr(string.indexOf("by") + 1);
			beforetext = string.substr(0, string.indexOf(','));

			rdio.call('search', {'query': aftertext, 'types': 'artist'}, function(err, data){
				artistkey = data.result.results[0].key;
			});

			io.emit('chat message', artistkey);

			rdio.call('search', {'query': beforetext, 'types': 'track'}, function(err, data){
				songkey = data.result.results[0].radio.key;
				checkkey = data.result.results[0].artistKey;
			});

			io.emit('chat message', songkey);
			io.emit('chat message', checkkey);

			if (artistkey = checkkey){
			io.emit('music message', songkey);
			} else {
			io.emit('chat message', "Can't find song.");
			}
			
			}

			string = string.replace('play+','');
			io.emit('chat message', string);

			rdio.call('search', {'query': string, 'types': 'artist, albums, track'}, function(err, data){
				key = data.result.results[0].topSongsKey;
				io.emit('music message', key);
			});

		} else if (string.indexOf("stop")>=0) {
			io.emit('control message', 'stop()');
		}

			// rdio.call('getPlaybackToken', {'domain': 'sleepy-earth-2844.herokuapp.com'}, function(err, tok){
			// 	io.emit('chat message', tok);
			// });

	    //console.log(data.toString());
	    console.log(fullstr);

	    io.emit('chat message', string);

	    data = "";
  	});
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg); 
  });
});
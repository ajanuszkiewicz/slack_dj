var express = require('express');
var app = express();
var http = require('http');
var _io = require('socket.io');
var data = '';

var Rdio = require('node-rdio');
var rdio = new Rdio(["ppebg64vtgcxat45rhrven46", "9YT2zjhE63"]);

_io.configure(function () {
  _io.set("transports", ["xhr-polling"]);
  _io.set("polling duration", 10);
});

var server =http.createServer(app);
var io = _io.listen(server);



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
			string = string.replace('play+','');
			io.emit('chat message', string);

			rdio.call('search', {'query': string, 'types': 'artist'}, function(err, data){
				key = data.result.results[0].topSongsKey;
				io.emit('music message', key);
			});


		}

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

server.listen(process.env.PORT || 3000);
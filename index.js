var express = require('express');
var app = express();
var querystring = require('querystring');
var http = require('http');
var _io = require('socket.io');
var data = '';

var Rdio = require('node-rdio');
var rdio = new Rdio(["ppebg64vtgcxat45rhrven46", "9YT2zjhE63"]);

var server =http.createServer(app);
var io = _io.listen(server);

var	artistkey = "";
var	songkey = "";
var	check = "";

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

	    console.log(fullstr);
	    io.emit('chat message', string);

		playSongAlbum(string);
	    
  	});
});

//playSongAlbum ('smells like teen spirit - nirvana');
//playSongAlbum ('bit by bit by mother mother');

function playSongAlbum (request) {

	console.log(request);

	genstring = request.replace('play','');
	aftertext = genstring.substr(genstring.lastIndexOf("by") + 3);
	beforetext = genstring.substr(0, genstring.lastIndexOf('by'));

	console.log(aftertext);
	console.log(beforetext);

	findArtist();
	findTrack();
}

function findArtist(){
	rdio.call('search', {'query': aftertext, 'types': 'artist'}, function (err, data){
		artistkey = data.result.results[0].key;
		io.emit('chat message', artistkey);
	});
}

function findTrack(){
	rdio.call('search', {'query': beforetext, 'types': 'track'}, function (err, data){
		songkey = data.result.results[0].key;
		check = data.result.results[0].artistKey;

		io.emit('chat message', songkey);
		io.emit('chat message', check);
	
		nextStep();	

	});
}

function nextStep(){
				console.log('artistkey: ' + artistkey);
				console.log('songkey: ' + songkey);
				console.log('checkkey: ' + check);


			if (artistkey == check){

				io.emit('music message', songkey, beforetext, aftertext);

				console.log("Success");

			} else {

				io.emit('chat message', "Can't find song.");

				console.log("Fail");
			}

	data = "";
}


io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg); 
  });
});
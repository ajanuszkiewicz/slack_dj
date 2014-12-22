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

var aftertext;
var beforetext;
var	artistkey;
var artistname;
var	songkey;
var songname;
var	check;
var skipcounter = 0;

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
fullstr = fullstr.replace(/\+/g," ");

console.log(fullstr);
io.emit('chat message', fullstr);

if (fullstr.search("dj: play") != -1){
	string = fullstr.replace('dj: play ','');
	playSongAlbum(string);
	data = "";
} else if (fullstr.search("dj: skip") != -1){
	skipSong();
} else if (fullstr.search("dj: random") != -1){
	string = fullstr.replace('dj: random ','');
	randomSong(string);
	data = "";
} else {
	data = "";
}

//playSongAlbum ('smells like teen spirit - nirvana');
//playSongAlbum ('bit by bit by mother mother');
//playSongAlbum ('lola by the kinks');
//randomSong("bonobo");

function playSongAlbum (request) {

	console.log(request);

	aftertext = request.substr(request.lastIndexOf("by") + 3);
	beforetext = request.substr(0, request.lastIndexOf('by'));

	console.log(aftertext);
	console.log(beforetext);

	findArtist(aftertext,function(text1, text2){
		findTrack(beforetext,function(text1, text2, text3){
			nextStep();
		});
	});
}

function randomSong (request) {

	console.log(request);

	findArtist(request,function(text1, text2){
		artistTracks(artistkey,function(text1, text2, text3){
			nextStep();
		});
	});
}

function findArtist(input, callback){
	rdio.call('search', {'query': input, 'types': 'artist'}, function (err, data){
        if (err) {
            return;
        } else if (data.result.artist_count == '0'){
        	res.send({ "text": "Sorry, I couldn't find that artist." });
        	return;
        }

		artistkey = data.result.results[0].key;
		artistname = data.result.results[0].name;
		io.emit('chat message', artistkey);

		callback(artistkey, artistname);
	});
}

function findTrack(input, callback){
	rdio.call('search', {'query': input, 'types': 'track', 'count': '50'}, function (err, track){
		 if (err) {
		    return;
		}

		var obj = [];
		var flag;

		for(var i=0; i<track.result.results.length; i++) {
		  for(key in track.result.results[i]) {

		  	asdf = track.result.results[i].artistKey;

		    if(asdf == artistkey) {
		      flag = 1;
		      obj.push(track.result.results[i]);
		    }
		  }
		}

		if (flag != 1) {
		   res.send({ "text": "Sorry, I couldn't find that song." });
		   data = "";
		  return;
		}

		songkey = obj[0].key;
		songname = obj[0].name;
		check = obj[0].artistKey;

		io.emit('chat message', songkey);
		io.emit('chat message', check);

		console.log("Second Check");	

		callback(songkey, songname, check);

	});
}

function artistTracks(input, callback){

	rdio.call('getTracksForArtist', {'artist': input, 'count': '50'}, function (err, track){
		 if (err) {
		    return;
		}

		var obj = [];

		console.log('random length: ' + track.result.length);
		var rand = Math.floor((Math.random()* track.result.length) + 1);
		obj.push(track.result[rand]);

		songkey = obj[0].key;
		songname = obj[0].name;
		check = obj[0].artistKey;

		io.emit('chat message', songkey);
		io.emit('chat message', check);

		callback(songkey, songname, check);

	});
}

function nextStep(){
				console.log('artistkey: ' + artistkey);
				console.log('songkey: ' + songkey);
				console.log('checkkey: ' + check);


			if (artistkey == check){

				string = "Added " + songname + " by " + artistname + " to play queue.";
				res.send({ "text": string });
				io.emit('music message', songkey, beforetext, aftertext);
				io.emit('chat message', string);

				console.log("Success");

			} else {

				io.emit('chat message', "Can't find song.");
				res.send({ "text": "Sorry, I couldn't find that song." });
				console.log("Fail");
			}

	data = "";
}

function skipSong (){
	skipcounter ++;
	msg = "skip";
	if (skipcounter == 3){
		io.emit('control message', msg);
		res.send({ "text": "Strike 3! The song has been vetoed by your peers." });
		skipcounter = 0;
	} else{
		string = "Stike " + skipcounter + "!";
		res.send({ "text": string });
	}

	data = "";
}
   
  	});
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg); 
  });
});
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
string = fullstr.replace('dj:+','');

console.log(fullstr);
io.emit('chat message', string);

if (string.search("play") != -1){
	playSongAlbum(string);
} else if (string.search("skip") != -1){
	skipSong();
} else {
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


//playSongAlbum ('smells like teen spirit - nirvana');
//playSongAlbum ('bit by bit by mother mother');
//playSongAlbum ('lola by the kinks');

function playSongAlbum (request) {

	console.log(request);

	genstring = request.replace('play+','');
	genstring = genstring.replace(/\+/g," ");
	aftertext = genstring.substr(genstring.lastIndexOf("by") + 3);
	beforetext = genstring.substr(0, genstring.lastIndexOf('by'));

	console.log(aftertext);
	console.log(beforetext);

	findArtist();
}

function findArtist(){
	rdio.call('search', {'query': aftertext, 'types': 'artist'}, function (err, data){
         if (err) {
            return;
        }

		artistkey = data.result.results[0].key;
		artistname = data.result.results[0].name;
		io.emit('chat message', artistkey);

		findTrack(artistkey);
	});

}

function findTrack(){
	rdio.call('search', {'query': beforetext, 'types': 'track', 'count': '50'}, function (err, track){
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
	
		nextStep();	

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


	    
  	});
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg); 
  });
});
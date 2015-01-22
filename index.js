var express = require('express');
var app = express();
var querystring = require('querystring');
var http = require('http');
var https = require('https');
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
var albumart;
var	check;
var skipcounter = 0;
var counter = 0;
var songlist = [];
var reqname;
var status;


var sendBack;
var playSongAlbum;
var randomSong;
var findArtist;
var findTrack;
var artistTracks;
var nextStep;
var skipSong;
var sendRes;


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
fullstr = fullstr.toLowerCase();
reqname = getQueryVariable(data,'user_name');

console.log(fullstr);
io.emit('chat message', fullstr);

if (status == 1){
	if (fullstr.search("dj: play") != -1){
		string = fullstr.replace('dj: play ','');
		playSongAlbum(string);
		data = "";
	} else if (fullstr.search("dj: skip") != -1){
		skipSong();
		data = "";
	} else if (fullstr.search("dj: random") != -1){
		string = fullstr.replace('dj: random ','');
		randomSong(string);
		data = "";
	} else if (fullstr.search("dj: now") != -1){
		currentSong();
		data = "";
	} else if (fullstr.search("dj: list") != -1){
		printPlaylist();
		data = "";
	} else if (fullstr.search("dj: force") != -1){
		playQueue();
		data = "";
	} else {
		sendBack ("Huh?");
		data = "";
	}
} else {
	sendBack ("Not connected.");
	data = "";
}

res.send ("");

  	});

});

//playSongAlbum ('smells like teen spirit - nirvana');
//playSongAlbum ('bit by bit by mother mother');
//playSongAlbum ('lola by the kinks');
//randomSong("bonobo");

playSongAlbum = function (request) {

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

randomSong = function (request) {

	console.log(request);

	findArtist(request,function(text1, text2){
		artistTracks(artistkey,function(text1, text2, text3){
			nextStep();
		});
	});
}

findArtist = function (input, callback){
	rdio.call('search', {'query': input, 'types': 'artist'}, function (err, data){


        if (err) {
            return;
        } else if (data.result.artist_count == '0'){
        	//sendBack ("Sorry, I couldn't find that artist.");
        	//res.send ("Sorry, I couldn't find that artist.");
        	sendBack ("Sorry, I couldn't find that artist.");
        	return;
        }

        
		artistkey = data.result.results[0].key;
		artistname = data.result.results[0].name;
		io.emit('chat message', artistkey);

		callback(artistkey, artistname);
	});
}

findTrack = function (input, callback){
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
		   sendBack ("Sorry, I couldn't find that song.");
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

artistTracks = function (input, callback){

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
		albumart = obj[0].icon;
		check = obj[0].artistKey;

		io.emit('chat message', songkey);
		io.emit('chat message', check);

		callback(songkey, songname, check);

	});
}

function nextStep (){
				console.log('artistkey: ' + artistkey);
				console.log('songkey: ' + songkey);
				console.log('checkkey: ' + check);


			if (artistkey == check){

				string = "Added " + songname + " by " + artistname + " to play queue.";
				sendBack (string);
				songQueue (songkey, songname, artistname, albumart, reqname);
				
				// if (songlist.length !== false){
				// 	io.emit('music message', songkey, beforetext, aftertext);
				// }
				
				// io.emit('chat message', string);

				console.log("Success");

			} else {

				io.emit('chat message', "Can't find song.");
				sendBack ("Sorry, I couldn't find that song.");
				console.log("Fail");
			}

	data = "";
}


function songQueue (key, name, artist, art, requester) {
	songlist.push ({songName: name, artistName: artist, songKey: key, albumArt: art, requestBy: requester});
	console.log(songlist);

	if (songlist.length ==  1){
		io.emit('music message', key, name, artist);
		io.emit('info message', name, artist, art);
	}else{
		return;
	}

}

function playQueue (){
	console.log("queue called");

	if (songlist.length >  1){

		songlist.shift();

		song = songlist[0].songKey;
		name = songlist[0].songName;
		artist = songlist[0].artistName;
		art = songlist[0].albumArt;

		io.emit('music message', song, name, artist);
		io.emit('info message', name, artist, art);

		console.log("Songlist Length: " + songlist.length);
	}else{
		sendBack("No more songs to play.");
	}
}


function skipSong (){
	skipcounter ++;
	msg = "skip";
	if (skipcounter == 3 && songlist.length > 1){
		sendBack ("Strike 3! The song has been vetoed by your peers.");
		playQueue();
		//skipcounter = 0;
	} else{
		string = "Strike " + skipcounter + "!";
		sendBack(string);
	}
}

function currentSong (){

	if (songlist.length >= 1){
	name = songlist[0].songName;
	artist = songlist[0].artistName;
	request = songlist[0].requestBy;

	msg = "Currently playing " + name + " by " + artist + " requested by " + request + ".";

	sendBack(msg);
	} else{
		sendBack("No song is playing.");
	}


}	

function printPlaylist(){

		if (songlist.length >= 1){
					var list = "";

		for(var i=0; i<songlist.length; i++) {
			list += i + ". " + songlist[i].songName + " by " + songlist[i].artistName + " requested by " + songlist[i].requestBy + "\n";
		}

		sendBack(list);
	} else {
		sendBack("No songs queued.");
	}

}

sendBack = function (msg){

	var data = '{"text": '+ msg +'}';

	var options = {
    hostname: 'hooks.slack.com',
    //LOCAL
    //path: '/services/T024G0U2X/B0386K1RU/VUrCRWgsRfM7HBWK7AmMht98',
    //HEROKU
    path: '/services/T024G0U2X/B03A0NR3P/WyCjL8lk0er4SDOPG8fkKlk6',
    method: 'POST',
	};

	var payload = {
		"text"	: msg
	};

	var req = https.request(options, function(res) {
	    res.setEncoding('utf8');
	    res.on('data', function (chunk) {
	        console.log("body: " + chunk);
	    });
	});

    req.write(JSON.stringify(payload));
    req.end();
    console.log(data)
}

io.on('connection', function(socket){

	status = 1;
	// socket.on('disconnect', function(){
	//   status = 0;
	//   counter = 0;
	//   skipcounter = 0;
	// });

	socket.on('control message', function(msg){
	console.log('PlayState: ' + msg);
	  // if (msg == 2){
	  //   counter++;
	  //   console.log("Counter: " + counter);
	  //   if (counter == 2){
	  //   	console.log("Skip Counter: " + skipcounter);
	  //   	if (skipcounter != 3 && songlist.length > 1){
	  //   		counter = 0;
	  //   		console.log('MOTHER FUCKER');
	  //   		playQueue();
	  //   	} else if (songlist.length == 1){
	  //   		counter = 0;
	  //   		sendBack("Last song played.");
	  //   		console.log("List Reset");
	  //   		//songlist = [];
	  //   	} else {
	  //   		counter = 0;
	  //   		skipcounter = 0;
	  //   	}
	  //   }
	  // }

    	if (skipcounter != 3 && songlist.length > 1){
			playQueue();
		} else if (songlist.length == 1){
			sendBack("Last song played.");
			console.log("List Reset");
			songlist = [];
		} else {
			counter = 0;
			skipcounter = 0;
		}

	});
	// socket.on('chat message', function(msg){
	// //console.log('message: ' + msg);
	// //playSongAlbum(msg);
	// //playQueue();
	// });
	socket.on('song message', function(msg){
	sendBack(msg);
	});
});
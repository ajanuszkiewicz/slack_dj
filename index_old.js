var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var data = '';

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
	    console.log(data.toString());
	    console.log(getQueryVariable(data,'text'));
	    console.log();

	    io.emit('chat message', getQueryVariable(data,'text'));
  	});
});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '../Slack DJ/', 'index.html'));
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg); 
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
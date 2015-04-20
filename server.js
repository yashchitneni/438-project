var io;
var http;
var https;
var querystring;
var zlib;
var twitterBearerToken;

function initialize() {
    //variables to initialize the server 
    var express = require('express');
    var app = express();
	http = require('http');
	https = require('https');
	zlib = require('zlib');
	querystring = require('querystring');
    var server = http.Server(app);
    io = require('socket.io')(server);
    
    server.listen(10004);
    console.log("Listening on port 10004");	
    app.use(express.static(__dirname + "/client"));
			
    //start listening for server events
	getTwitterAccessToken(setEventHandlers);
}

function getTwitterAccessToken(callback) {
	var postData = querystring.stringify({ 'grant_type':'client_credentials' });
	var options = {
		method: 'POST',
		host: 'api.twitter.com',
		path: '/oauth2/token',
		auth: 'qAAM4W4tKrHBo6kE2ouLl7qU1:ul3C4Hr8C1opVtpxmdDkHH7C9JZlRHg2yasvKL5ofYNdvwJSoZ',
		headers: {
			'User-Agent': 'Whats Poppin App',
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			'Content-Length': postData.length
		}
	};
	
	var req = https.request(options, function(res) {
		if(res.statusCode != 200) {
			//Failed to obtain bearer token
		}
		
		var bodyChunks = [];
		res.on('data', function(chunk) {
			bodyChunks.push(chunk);
		}).on('end', function() {
			var body = Buffer.concat(bodyChunks);
			twitterBearerToken =  JSON.parse(body).access_token;
			console.log("Twitter Bearer Token: " + twitterBearerToken);
			callback();
		})
	});
	
	req.write(postData);
	req.end();
}

function getTwitterTrends(client, yahooWOEID) {
	if(yahooWOEID != 0) {
		var trends = "";
		var options = {
			method: 'GET',
			host: 'api.twitter.com',
			path: '/1.1/trends/place.json?id=' + yahooWOEID.toString(),
			headers: {
				'User-Agent': 'Whats Poppin App',
				'Authorization': 'Bearer ' + twitterBearerToken,
				'Accept-Encoding': 'gzip'
			}
		};
			
		var req = https.request(options, function(res) {		  
			var bodyChunks = [];
			res.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				zlib.unzip(body, function(err, body) {
					if (!err) {
						trends = body.toString();
					}
					console.log("Twitter Trends: " + trends);
					client.emit('twitter_trends', { result : trends });
				});
			})
		});
		req.end();
	}
	else {
		client.emit('invalid_place', { error: 'Could not locate place' });
	}
}

function getYahooWOIED(callback, client, place) {
	var WOIED = 0;
	var placeQuery = 'places.q(\'' + encodeURIComponent(place) + '\')';
	var options = {
		method: 'GET',
		host: 'where.yahooapis.com',
		path: '/v1/' +  placeQuery + '?format=json&appid=dj0yJmk9VmF6OGt4T01VdUx0JmQ9WVdrOU5FZFlWblZ6TkdNbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1iNA--',
		headers: {
			'User-Agent': 'Whats Poppin App',
			'Accept-Encoding': 'gzip'
		}
	};

	var req = http.request(options, function(res) {	  
		var bodyChunks = [];
		res.on('data', function(chunk) {
			bodyChunks.push(chunk);
		}).on('end', function() {
			var body = Buffer.concat(bodyChunks);
			zlib.unzip(body, function(err, body) {
				if (!err) {
					body = JSON.parse(body.toString());
					if(body.places.count > 0) {
						WOIED = body.places.place[0].woeid;
					}
				}
				console.log("WOIED: " + WOIED);
				callback(client, WOIED);
			});
		})
	});	
	req.end();
}

function setEventHandlers() {
   //on client connection, run onSocketEvent
   console.log("Accepting connections...");
    io.sockets.on("connection", onSocketEvent);
}

function onSocketEvent(client){
    //monitor the socket events once the connection is established
    console.log("New client connected: " + client.id);
    client.on("place", onPlaceSearch);
}

//once a command has been received, parse it
function onPlaceSearch(place){
	console.log(place);
	getYahooWOIED(getTwitterTrends, this, place);
}

//start server
initialize();



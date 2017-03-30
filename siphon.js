var fs = require('fs');
var http = require('http');
var auth = require('./auth.js');
var util = require('util');
var appClient = require('./appClient.js');


appClient.tokenValue(function(token) {
        if (token === false)
                throw "Failed to get token from API / Disk";
        else {
                appClient.appNexusRequest('GET', '/member', null, function(data) {
                        console.log('got member: ' + data.length) 
		})
	}
});

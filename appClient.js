var fs = require('fs');
var http = require('http');
var auth = require('./auth.js');
var util = require('util');
var tokenPath = './token';


exports.tokenValue = function (callBack) {
	if (exports.isValidFromDisk()) {
		console.log('Found valid token on disk')
		callBack(fs.readFileSync(tokenPath, 'utf-8'));
	}
	else {
		console.log('Getting token from API')
		exports.getTokenFromAPI(function(token) {
			callBack(token);
		});
	}
};
 
exports.isValidFromDisk = function() {
	if (fs.existsSync(tokenPath)) {
		stats = fs.statSync(tokenPath);
		mtime = new Date(util.inspect(stats.mtime));
		expiry = 3600 * 2 * 1000;
		if (Date.now() - mtime > expiry)
			return false;
		else
			return true;
	}
	else
		return false;
};

exports.getTokenFromAPI = function(callBack) {
	
	exports.appNexusRequest({'path': '/auth', 'method': 'POST'}, null, auth, function (data) {
		
		jsonResponse = JSON.parse(data).response;
		if (jsonResponse.status == 'OK') {
			token = jsonResponse.token;
			fs.writeFileSync(tokenPath, token);
			console.log('Response OK, written to disk');
			callBack(token);
		}
		else
			callBack(false);
		
	});
}

exports.appNexusRequest = function(options, token, data, callBack) {
	defaults = {host: 'api.appnexus.com', 'port': 80, 'encoding': 'utf-8'};
	for (key in defaults) {
		if (typeof options[key] == 'undefined') {
			options[key] = defaults[key];
		}
	}
	
	doRequest = function(options) {

		var req = http.request(options, function(res) {
			data = [];
					
			res.setEncoding(options.encoding);
			res.on('data', function(chunk) {
				data.push(chunk);
			});
			
			res.on('end', function () {
				if (options.encoding == 'binary')
					data = Buffer.concat(data.map(function (o){ return new Buffer(o, 'binary')}))
				else
					data = data.join('');
								
				callBack(data, res.headers);
			});
		});
		

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
			callBack(false);
		});
		
		if (data !== null)
			req.write(JSON.stringify(data));

		req.end();
	}
	
	if (options.path != '/auth')
		options.headers = {'Authorization': token}

	doRequest(options);
}


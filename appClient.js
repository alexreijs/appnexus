var fs = require('fs');
var http = require('http');
var auth = require('./auth.js');
var util = require('util');
var tokenPath = './token';


exports.tokenValue = function (callBack) {
	if (exports.isValidFromDisk()) {
        	//console.log('Found valid token on disk')
                callBack(fs.readFileSync(tokenPath, 'utf-8'));
        }
        else {
        	//console.log('Getting token from API')
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
	exports.appNexusRequest('POST', '/auth', auth, function (data) {
        	jsonResponse = JSON.parse(data).response;
                if (jsonResponse.status == 'OK') {
                	token = jsonResponse.token;
 			fs.writeFileSync(tokenPath, token);
			//console.log('Response OK, written to disk');
			callBack(token);
		}
		else
			callBack(false);
	});
}

exports.appNexusRequest = function(method, path, data, callBack) {
	exports.tokenValue(function(token) {

                var options = {
                        host: 'api.appnexus.com',
                        port: 80,
                        path: path,
                        method: method
                };

		if (path != '/auth') {
			options.headers = {
				'Authorization': token
			}				
		}

                var req = http.request(options, function(res) {
                        res.setEncoding('utf8');
                        res.on('data', callBack);
                });
                req.on('error', function(e) {
                        //console.log('problem with request: ' + e.message);
                        callBack(false);
                });
                // write data to request body
		if (data !== null)
	                req.write(JSON.stringify(data));

                req.end();
	});
}

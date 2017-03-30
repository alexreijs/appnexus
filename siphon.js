var fs = require('fs');
var http = require('http');
var url = require('url');
var auth = require('./auth.js');
var util = require('util');
var appClient = require('./appClient.js');

getFeed = function(feedName, feedHour, callBack) {

	appClient.tokenValue(function(token) {
		
		if (token === false)
			throw "Failed to get token from API / Disk";
		else {
			appClient.appNexusRequest({'path': '/siphon', 'method': 'GET'}, token, null, function(siphonData) { 
				siphonData = JSON.parse(siphonData).response;
		
				for (i in siphonData.siphons) {
					
					(function(siphon) {
					
						if (siphon.name == feedName && siphon.hour == feedHour) {
							console.log('Found feed "' + siphon.name + '", hour "' + siphon.hour + '", getting splits ..');
							partsLeft = siphon.splits.length - 1;
							
							for (s in siphon.splits) {
									
								console.log('Getting download location .. ');								
							
								(function(path, part) {
									
									appClient.appNexusRequest({'path': path, 'method': 'GET'}, token, null, function(siphonLocation, headers) { 
										console.log('Download data from "' + path + '" ..');
										
										(function (downloadLocation, filePath) {
											appClient.appNexusRequest({host: downloadLocation.hostname, 'path': downloadLocation.path, 'method': 'GET', 'encoding': 'binary'}, token, null, function(siphonDownload) { 
												console.log('Saving data to "' + filePath + '" ..');

												fs.writeFileSync(filePath, siphonDownload, 'binary');

												if (partsLeft == 0)
													callBack(true);
												
												partsLeft--;
											});
										})(url.parse(headers.location), './data/feeds/' + siphon.name + '/' + siphon.hour + '_' + part + '.gz')
									});
								})('/siphon-download?siphon_name=' + siphon.name + '&hour=' + siphon.hour + '&timestamp=' + siphon.timestamp + '&member_id=7463&split_part=' + siphon.splits[s].part, siphon.splits[s].part)
							}
						}
					})(siphonData.siphons[i])
				}
			});
		}
	});
}  


getFeedByDay = function(feed, day, callBack) {

	days = [];
	for (i = 0; i <= 23; i++) {
		days.push(day + '_' + (i < 10 ? '0' + i : i));	
	}

	function getFeedDay() {
		day = days.shift();	
		getFeed(feed, day, function(success) {
			if (success == false)
				console.log('Something went wrong getting feed')
			else {
				if (days.length > 0)
					getFeedDay();
				else
					callBack(true)
			}
		});
	}
	
	getFeedDay();
	
}




getFeedByDay('standard_feed', '2017_03_27', function(success) {
	console.log(success);
});


/*
getFeed('standard_feed', '2017_03_27_06', function (success) {
	console.log(success);
});
*/
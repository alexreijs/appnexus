var fs = require('fs');
var http = require('http');
var url = require('url');
var auth = require('./auth.js');
var util = require('util');
var mkdirp = require('mkdirp');
var appClient = require('./appClient.js');
var siphonPath = './siphon';


getFeed = function(feedName, feedDay, feedHour, callBack) {
	
	if (feedHour < 10)
		feedHour = '0' + parseInt(feedHour);
	
	feedId = feedDay + '_' + feedHour;

	appClient.tokenValue(function(token) {
		
		if (token === false)
			throw "Failed to get token from API / Disk";
		else {
			handleSiphon = function(siphonData) { 
				siphonData = JSON.parse(siphonData).response;
		
				for (i in siphonData.siphons) {
					
					(function(siphon) {
					
						if (siphon.name == feedName && siphon.hour == feedId) {
							console.log('\nFound feed "' + siphon.name + '", hour "' + siphon.hour + '", getting splits ..');
							partsLeft = siphon.splits.length - 1;
							
							splits = siphonData.siphons[i].splits.map(function (s) {
								return {part: s.part, path: '/siphon-download?siphon_name=' + siphon.name + '&hour=' + siphon.hour + '&timestamp=' + siphon.timestamp + '&member_id=7463&split_part=' + s.part}
							});
																
							getSplit = function() {
								split = splits.shift();
								path = split.path;
								part = split.part;
								
								appClient.appNexusRequest({'path': path, 'method': 'GET'}, token, null, function(siphonLocation, headers) { 
									console.log('Download data from "' + path + '" ..');
									
									(function (downloadLocation, saveDirectory, saveFileName) {
										savePath = saveDirectory + '/' + saveFileName;
										mkdirp.sync(saveDirectory);
										console.log(savePath);
										if (fs.existsSync(savePath)) {
											console.log('Feed already exists on disk!');
											(splits.length > 0) ? getSplit() : callBack(true);
										}
										else {
											appClient.appNexusRequest({host: downloadLocation.hostname, 'path': downloadLocation.path, 'method': 'GET', 'encoding': 'binary'}, token, null, function(siphonDownload) { 
												console.log('Saving data to "' + savePath + '" ..');
												fs.writeFileSync(savePath, siphonDownload, 'binary');
												(splits.length > 0) ? getSplit() : callBack(true);
											});
										}
									})(url.parse(headers.location), './data/feeds/' + siphon.name + '/' + feedDay, feedId + '_' + part + '.gz')
								});
							}
							
							if (splits.length > 0)
								getSplit();
							else {
								console.log('No part splits were found ..')
								callBack(true);
							}
						}
					})(siphonData.siphons[i])
				}
			}
				
			if (fs.existsSync(siphonPath)) {
				stats = fs.statSync(siphonPath);
				mtime = new Date(util.inspect(stats.mtime));				
			}
			else
				mtime = 0;
			
			if (Date.now() - mtime > 3600 * 1000) {
				console.log("Siphon data out of date, getting from API ..");
				appClient.appNexusRequest({'path': '/siphon', 'method': 'GET'}, token, null, function(siphonData) { 
					fs.writeFileSync(siphonPath, siphonData);
					handleSiphon(siphonData); 
				});
			}
			else {
				console.log("Siphon data read from disk");
				siphonData = fs.readFileSync(siphonPath, 'utf-8');
				handleSiphon(siphonData); 
			}
		}
	});
}  


getFeedByDay = function(feed, day, callBack) {

	hours = [];
	for (i = 0; i <= 23; i++) {
		hours.push(i < 10 ? '0' + i : i);	
	}

	function getFeedDay() {
		hour = hours.shift();	
		getFeed(feed, day, hour, function(success) {
			if (success == false)
				console.log('Something went wrong getting feed')
			else {
				if (hours.length > 0)
					getFeedDay();
				else
					callBack(true)
			}
		});
	}
	
	getFeedDay();
}



feed = process.argv[2];
day = process.argv[3];
hour = process.argv[4];

allowedFeeds = ['standard_feed', 'segment_feed', 'bid_landscape_feed', 'auction_segment_feed'];


if (allowedFeeds.indexOf(feed) == -1) {
	console.log('\nPlease enter the type of feed you want to use as the first argument.');
	console.log('Possible feeds include: ' + allowedFeeds.join(', ') + '.');
	process.exit();
}
else if (new RegExp('^[0-9]{4}_[0-9]{2}_[0-9]{2}$').test(day) == false) {
	console.log('\nPlease enter a correct day as second argument.');
	console.log('The correct format to use is YYYY_MM_DD');
	process.exit();
}


if (typeof hour == 'undefined') {
	console.log('Getting entire day of ' + day + ' .. \n')
	getFeedByDay(feed, day, function(success) {});
}
else {
	console.log('Getting day ' + day + ', hour ' + hour + '.. \n')
	getFeed(feed, day, hour, function (success) {});
}
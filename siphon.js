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
					
					(function(siphon, noParts) {
					
						if (siphon.name == feedName && siphon.hour == feedId) {
							console.log('\nProcessing feed: "' + siphon.name + '", day & hour: "' + siphon.hour + '"..');
												
							splits = siphonData.siphons[i].splits.map(function (s) {
								return {part: s.part, path: '/siphon-download?siphon_name=' + siphon.name + '&hour=' + siphon.hour + '&timestamp=' + siphon.timestamp + '&member_id=7463&split_part=' + s.part}
							});
						
							getSplit = function() {
								split = splits.shift();
								path = split.path;
								part = split.part;
								
								appClient.appNexusRequest({'path': path, 'method': 'GET'}, token, null, function(siphonLocation, headers) { 
								
									(function (downloadLocation, saveDirectory, saveFileName, part) {
										savePath = saveDirectory + '/' + saveFileName;
										mkdirp.sync(saveDirectory);
										if (fs.existsSync(savePath)) {
											console.log('Part ' + (parseInt(part) + 1) + '/' + noParts + ': download already exists on disk!');
											(splits.length > 0) ? getSplit() : callBack(true);
										}
										else {
											console.log('Part ' + (parseInt(part) + 1) + '/' + noParts + ': downloading data..');
											appClient.appNexusRequest({host: downloadLocation.hostname, 'path': downloadLocation.path, 'method': 'GET', 'encoding': 'binary'}, token, null, function(siphonDownload) { 
												fs.writeFileSync(savePath, siphonDownload, 'binary');
												console.log('Part ' + (parseInt(part) + 1) + '/' + noParts + ': saved data to disk!');
												(splits.length > 0) ? getSplit() : callBack(true);
											});
										}
									})(url.parse(headers.location), outputdir + '/data/feeds/' + siphon.name + '/' + feedDay, feedId + '_' + part + '.gz', part)
								});
							}
							
							if (splits.length > 0)
								getSplit();
							else {
								console.log('No part splits were found!')
								callBack(true);
							}
						}
					})(siphonData.siphons[i], siphonData.siphons[i].splits.length)
				}
			}
				
			if (fs.existsSync(siphonPath)) {
				stats = fs.statSync(siphonPath);
				mtime = new Date(util.inspect(stats.mtime));				
			}
			else
				mtime = 0;
			
			if (Date.now() - mtime > 3600 * 1000) {
				console.log("Siphon data out of date, getting from API..");
				appClient.appNexusRequest({'path': '/siphon', 'method': 'GET'}, token, null, function(siphonData) { 
					fs.writeFileSync(siphonPath, siphonData);
					handleSiphon(siphonData); 
				});
			}
			else {
				//console.log("Siphon data read from disk");
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



outputdir = process.argv[2];
feed = process.argv[3];
day = process.argv[4];
hour = process.argv[5];

allowedFeeds = ['standard_feed', 'segment_feed', 'bid_landscape_feed', 'auction_segment_feed'];

if (typeof outputdir == 'undefined') {
	console.log('\nPlease enter the output directory as the first argument.');
	console.log('Use "." for current folder');
	process.exit();
}
else if (allowedFeeds.indexOf(feed) == -1) {
	console.log('\nPlease enter the type of feed you want to use as the second argument.');
	console.log('Possible feeds include: ' + allowedFeeds.join(', ') + '.');
	process.exit();
}
else if (new RegExp('^[0-9]{4}_[0-9]{2}_[0-9]{2}$').test(day) == false) {
	console.log('\nPlease enter a correct day as third argument.');
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
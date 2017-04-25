outputdir = process.argv[2];
serviceName = process.argv[3] || '';
queryString = process.argv[4] || '';

allowedServices = ["campaign","creative","line-item","publisher"];

if (typeof outputdir == 'undefined') {
	console.log('\nPlease enter the output directory as the first argument.');
	console.log('Use "." for current folder');
	process.exit();
}
else if (serviceName.length == 0) {
	console.log('Please enter a service name as the second argument.');
	console.log('Sample service names are ' + allowedServices.join(', ') + '.');
	process.exit();
}


exports.outputdir = outputdir;


var fs = require('fs');
var http = require('http');
var url = require('url');
var mkdirp = require('mkdirp');
var json2csv = require('json2csv');
var auth = require('./auth.js');
var appClient = require('./appClient.js');


getServiceByName = function(serviceName, callBack) {
	appClient.tokenValue(function(token) {
		dataArray = [];
		getService = function(startElement) {
			path = '/' + serviceName + '?' + queryString + (queryString.length > 0 ? '&' : '') + 'start_element=' + startElement;
			appClient.appNexusRequest({'path': path, 'method': 'GET'}, token, auth, function (data) {
				
				response = JSON.parse(data).response;
				
				if (/change.log/g.test(serviceName))
					outputTerm = serviceName.replace(/\-/g, '_').toLowerCase() + 's';
				else 
					outputTerm = typeof response.dbg_info == 'undefined' ? serviceName + 's' : response.dbg_info.output_term;

				serviceResponse = response[outputTerm];
				
				console.log('Getting ' + outputTerm + ': ' + Math.ceil(response.start_element / 100) + ' / ' +  Math.ceil(response.count / 100))
				
				if (typeof serviceResponse == 'object' && serviceResponse.length > 0) {
					serviceResponse.forEach(function(o) {dataArray.push(o);})
					if (response.start_element + response.num_elements < response.count)
						getService(response.start_element + response.num_elements);
					else {
						saveDirectory = outputdir + '/data/services';
						mkdirp.sync(saveDirectory);			
						fs.writeFileSync(saveDirectory + '/' + serviceName + '.json', JSON.stringify(dataArray));
						fs.writeFileSync(saveDirectory + '/' + serviceName + '.csv', json2csv({ data: dataArray, fields: Object.keys(dataArray[0])}));
						console.log('Saved '  + dataArray.length + ' items.');
						callBack(dataArray);
					}					
				}
				else {
					console.log('No valid response found')
					callBack(false)
				}
			});
		}
		getService(0);
	});	
}





getServiceByName(serviceName, function(data) {
	//console.log(Object.keys(data[0]).join('","'));
});

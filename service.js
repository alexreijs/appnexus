var fields = require('./fields.js');


outputdir = process.argv[2];
serviceName = process.argv[3];

if (typeof outputdir == 'undefined') {
	console.log('\nPlease enter the output directory as the first argument.');
	console.log('Use "." for current folder');
	process.exit();
}
else if (Object.keys(fields).indexOf(serviceName) == -1) {
	console.log('Please enter a service name as the second argument.');
	console.log('Supported service names are ' + Object.keys(fields).join(', ') + '.');
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


getServiceByName = function(serviceName, fields, callBack) {
	appClient.tokenValue(function(token) {
		dataArray = [];
		getService = function(startElement) {
			path = '/' + serviceName + '?start_element=' + startElement;
			appClient.appNexusRequest({'path': path, 'method': 'GET'}, token, auth, function (data) {
				
				response = JSON.parse(data).response;
				response[serviceName + 's'].forEach(function(o) {dataArray.push(o);})
				
				//dataArray.forEach(function(o) {
					;
				//})
				
				if (response.start_element + response.num_elements < response.count)
					setTimeout(getService, 200, response.start_element + response.num_elements);
				else {
					saveDirectory = outputdir + '/data/services';
					mkdirp.sync(saveDirectory);			
					fs.writeFileSync(saveDirectory + '/' + serviceName + '.json', JSON.stringify(dataArray));
					
					saveCSV = true;
					dataArray.forEach(function(o) {
						if (Object.keys(o).length != fields[serviceName].length)
							saveCSV = false;
					})
					
					saveCSV ? fs.writeFileSync(saveDirectory + '/' + serviceName + '.csv', json2csv({ data: dataArray, fields: fields[serviceName]})) : console.log('Number of defined fields (columns) incorrect, please specify fields.js!\nUse following fields:\n"' + Object.keys(dataArray[0]).join('","') + '"');
					callBack(dataArray);
				}					
			});
		}
		getService(0);
	});	
}





getServiceByName(serviceName, fields, function(data) {
	//console.log(Object.keys(data[0]).join('","'));
});

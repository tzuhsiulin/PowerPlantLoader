var http = require('http');
var htmlParser = require('htmlparser2');
var CSVConverter = require("csvtojson").core.Converter;
var Q = require('q');

function PowerPlantLoader() {
	this.url = 'data.gov.tw';
}

/**
 * 取得水、火發電廠下載網址
 */
PowerPlantLoader.prototype.getDownloadUrl = function() {
	var deffered = Q.defer();

	var handle = new htmlParser.DomHandler(function(err, dom) {
		try {
			var linkDom = dom[3]['children'][3]['children'][3]['children'][5]['children'][3]['children'][1]['children'][11]['children'][1]['children'][1]['children'][1]['children'][1]['children'][2]['children'][1]['children'][0]['children'][0]['children'][2]['children'][0]['children'][0]['children'][0]['children'][0]['children'][0]['children'][0];
			var link = linkDom['attribs']['href'].match(/dataUrl=(.*).csv/g)[0].substr(8);
			deffered.resolve(link);
		} catch(e) {
			deffered.reject({
				'at': 'getDownloadUrl',
				'message': e
			});
		}
	});

	http.request({
		host: this.url,
		port: 80,
		path: '/node/8934',
		method: 'get'
	}, function(res) {
		var responseStr = '';

		res.on('data', function(chunk) {
			responseStr += chunk;
		});

		res.on('end', function() {
			new htmlParser.Parser(handle).parseComplete(responseStr);
		});
	}).on('error', function(error) {
		deffered.reject({
			'at': 'getDownloadUrl',
			'message': error
		});
	}).end();

	return deffered.promise;
};

/**
 * 下載水、火發電廠資訊
 */
PowerPlantLoader.prototype.downloadPowerPlantInfo = function(downloadUrl) {
	var deffered = Q.defer();

	http.get(downloadUrl, function(res) {
		var responseData = null;

		res.on('data', function(chunk) {
			if (responseData == null) {
				responseData = new Buffer(chunk);
			}
			else {
				responseData = Buffer.concat([responseData, chunk]);
			}
		});

		res.on('end', function() {
			var csvConverter = new CSVConverter();
			csvConverter.fromString(responseData.toString(), function(err, obj) {
				if (err) {
					deffered.reject({
						'at': 'downloadPowerPlantInfo',
						'message': err
					});
					return;
				}

				var result = [];
				for (var i = 0; i < obj.length; i++) {
					if (obj[i]['電廠名稱'] != '') {
						result.push({
							'PlantName': obj[i]['電廠名稱'],
							'Address': obj[i]['地址'],
							'StartDate': obj[i]['商轉日期'],
							'Name': obj[i]['機組名稱'],
							'Capacity': parseInt(obj[i]['裝置容量(kW)']),
							'Type': obj[i]['燃料種類']
						});
					}
				}
				deffered.resolve(result);
			});
		});
	}).on('error', function(error) {
		deffered.reject({
			'at': 'downloadPowerPlantInfo',
			'message': error
		});
	}).end();
	
	return deffered.promise;
};

module.exports = new PowerPlantLoader();
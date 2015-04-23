var PowerPlantInfoLoader = require('./PowerPlant/PowerPlantLoader');
var Q = require('q');

/**
 * 取得火、水發電廠資訊
 */
function loadPowerPlant() {
	var deffered = Q.defer();

	PowerPlantInfoLoader.getDownloadUrl()
		.then(function(url) {
			console.log('download power plant info');
			return PowerPlantInfoLoader.downloadPowerPlantInfo(url);
		}).then(function(plants) {
			console.log(plants);
		}).fail(function(err) {
			console.log(err);
		});

	return deffered.promise;
}
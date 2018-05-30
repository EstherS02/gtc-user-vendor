const _ = require('lodash');
const model = require('../sqldb/model-connect');


function populateData(populateInput){

	if (populateInput) {
		let populate = populateInput;
	
		let include = [], splitLevelOne = populate.split(",");
	
		_.forEach(splitLevelOne, function (valueLevelOne) {

		  let splitLevelTwo = valueLevelOne.split(".");
		  let searchLevel = include;
	
		  _.forEach(splitLevelTwo, function (valueLevelTwo) {
	
			let currentValue = { model: model[valueLevelTwo] };
			let searchIndex = _.findIndex(searchLevel, currentValue)
	
				if (searchIndex === -1) {
					searchLevel.push(currentValue);
				} else {
					if (!searchLevel[searchIndex].hasOwnProperty('include')) {
						searchLevel[searchIndex]['include'] = [];
						searchLevel = searchLevel[searchIndex]['include'];
					} else {
						searchLevel = searchLevel[searchIndex]['include'];
					}
				}
		  	});
		});

		return include;
	}
}

module.exports.populateData = populateData;
'use strict';

/*
 * Created with @iobroker/create-adapter v1.25.0
 */

// The adapter-core module gives you access to the core ioBroker functions
const utils = require('@iobroker/adapter-core');

// you need to create an adapter
const adapter = new utils.Adapter('labcom');

// additional required packackages
const axios = require('axios');

// function for fetching data
const getData = async (endpoint, token, accountFilter) => {
	try {
		var res = await axios({
			method: 'post',
			url: endpoint,
			data: `{ "query": "{ CloudAccount { email last_change_time Accounts ${accountFilter} { forename surname Measurements {  value unit timestamp parameter scenario } } } }" }`,
			headers: {
				Authorization: token,
				"Content-Type": "application/json"
			}
		});

		let cloudEmail = res.data['data']['CloudAccount']['email'];
		let lastchange = new Date(res.data['data']['CloudAccount']['last_change_time'] * 1000).toLocaleString();

		adapter.setObjectNotExists(`cloudaccount.email`, {
			type: 'state',
			common: {
				name: 'Cloud Account Email',
				role: 'email',
				type: 'string',
				email: cloudEmail,
				read: true,
				write: false
			}
		});
		adapter.setState(`cloudaccount.email`, cloudEmail, true);

		adapter.setObjectNotExists(`cloudaccount.lastchange`, {
			type: 'state',
			common: {
				name: 'Last change in measurement data synchronization',
				role: 'indicator.timestamp',
                                type: 'number',
                                read: true,
                                write: false
			}
		});
		adapter.setState(`cloudaccount.lastchange`, lastchange, true);

		var accounts = res.data['data']['CloudAccount']['Accounts'];
		accounts.forEach(account => { 
			let forename = account['forename'];
			let surname = account['surname'];
			
			adapter.setObjectNotExists(`accounts`, {
				type: 'channel',
				common: {
					name: 'Accounts',
					read: true,
					write: false
				}
			});

			// set account
			adapter.setObjectNotExists(`accounts.${forename}_${surname}`, {
				type: 'state',
				common: {
					name: 'Account Name',
					role: 'value',
					type: 'string',
					value: forename + ' ' + surname,
					read: true,
					write: false
				}
			});
			adapter.setState(`accounts.${forename}_${surname}`, forename + ' ' + surname, true);
			
			// pre-sort by measurement date-time desc
			var measurements = account['Measurements'];

			// emtpy array to log already imported parameter, to only import the latest measurements each
			var addedParameter = [];
			
			adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter`, {
				type: 'channel',
				common: {
					name: 'Parameter',
					read: true,
					write: false
				}
			});
			
			measurements.forEach(measurement => { 
				let userDate = new Date(measurement['timestamp'] * 1000).toLocaleString();
				let parameter = measurement['parameter'] ? measurement['parameter'].replace(/-/g, '_').replace(/ /g,"_") : "Unknown";
				let scenario = measurement['scenario'] ? measurement['scenario'].replace(/-/g, '_') : "Unknown";
				let measurementValue = measurement['value'];
				let unit = measurement['unit'];
				
				if(!(parameter in addedParameter)){
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}`, {
						type: 'channel',
						common: {
							name: measurement['parameter'],
							read: true,
							write: false
						}
					});
					
					// set measurement
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement`, {
						type: 'state',
						common: {
							name: 'Latest Measurement',
							role: 'value',
							type: 'string',
							value: measurementValue+' '+unit,
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement`, measurementValue+' '+unit, true);

					// set scenario
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement.scenario`, {
						type: 'state',
						common: {
							name: 'Scenario',
							role: 'value',
							type: 'string',
							value: scenario,
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement.parameter`, parameter, true);

					
					// set timestamp
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement.timestamp`, {
						type: 'state',
						common: {
							name: 'Timestamp',
							role: 'indicator.timestamp',
							type: 'number',
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.latestMeasurement.timestamp`, userDate, true);
					
					// add parameter to already imported parameter
					addedParameter[parameter] = true;
				}
			});
		});
		adapter.log.info('LabCom adapter - fetching data completed');
		adapter.log.info('LabCom adapter - shutting down until next scheduled call');
		adapter.stop();
	}  
	catch (error) {
		adapter.log.error(error);
	}
}


// is called when adapter shuts down
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called when adapter starts
adapter.on('ready', function () {
	adapter.log.info('LabCom adapter - started');

	const endpoint = "https://labcom.cloud/graphql";
	const token = adapter.config.labcomApiToken;
	const accountIds = adapter.config.labcomAccountIds;
	
	var accountFilter = ``;
	if(accountIds != 0){
		accountFilter = `(id:[${accountIds}])`;
	}
	
	adapter.log.info('LabCom adapter - fetching data ...');
	getData(endpoint, token, accountFilter);
});



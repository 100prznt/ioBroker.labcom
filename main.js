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
		let query = `{ "query": "{ CloudAccount { email last_change_time Accounts ${accountFilter} { id forename surname Measurements {  value unit timestamp parameter scenario } } } }" }`;

		adapter.log.debug('endpoint: ' + endpoint);
		adapter.log.debug('query: ' + query);
		adapter.log.debug('token: ' + token);
		adapter.log.debug('send request ...');

		var res = await axios({
			method: 'post',
			url: endpoint,
			data: `{ "query": "{ CloudAccount { email last_change_time Accounts ${accountFilter} { id forename surname Measurements {  value unit timestamp parameter scenario } } } }" }`,
			headers: {
				Authorization: token,
				"Content-Type": "application/json"
			}
		});

		adapter.log.debug('response: ' + res);

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
				type: 'string',
				read: true,
				write: false
			}
		});
		adapter.setState(`cloudaccount.lastchange`, lastchange, true);

		var accounts = res.data['data']['CloudAccount']['Accounts'];
		accounts.forEach(account => { 
			let forename = account['forename'].replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_');
			let surname = account['surname'].replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_');
			
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
					value: account['forename'] + ' ' + account['surname'],
					read: true,
					write: false
				}
			});
			adapter.setState(`accounts.${forename}_${surname}`, account['forename'] + ' ' + account['surname'], true);
			
			adapter.setObjectNotExists(`accounts.${forename}_${surname}.id`, {
				type: 'state',
				common: {
					name: 'Id',
					type: 'number',
					read: true,
					write: false,
					value: account['id']
				}
			});
			adapter.setState(`accounts.${forename}_${surname}.id`, account['id'], true);


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
				let unit = measurement['unit'];

				//new implementation for measurementValue, set value to NaN if the received data do nor represent a numeric value
				let	measurementValue = Number(measurement['value']); //return NaN if not a number
				let measurementStatus = 'Unknown';
				if (isNaN(measurementValue)) {
					switch (measurement['value']) {
						case 'OVERRANGE':
							measurementStatus = 'Overrange';
							break;
						case 'UNDERRANGE':
							measurementStatus = 'Underrange';
							break;
						default:
							//measurementStatus = measurement['value'];
							break;
					}
				} else {
					measurementStatus = 'OK';
				}

				
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
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.measurement`, {
						type: 'state',
						common: {
							name: measurement['parameter'],
							role: 'value',
							type: 'number',
							value: measurementValue,
							unit: unit,
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.measurement`, measurementValue, true);

					// set scenario
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.scenario`, {
						type: 'state',
						common: {
							name: measurement['scenario'],
							role: 'value',
							type: 'string',
							value: measurement['scenario'],
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.scenario`, measurement['scenario'], true);

					
					// set timestamp
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.timestamp`, {
						type: 'state',
						common: {
							name: 'Timestamp of ' + measurement['parameter'],
							role: 'indicator.timestamp',
							//role: 'date',
							type: 'string',
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.timestamp`, userDate, true);


					// set status
					adapter.setObjectNotExists(`accounts.${forename}_${surname}.parameter.${parameter}.status`, {
						type: 'state',
						common: {
							name: 'Status of ' + measurement['parameter'],
							role: 'info.status',
							type: 'string',
							value: measurementStatus,
							read: true,
							write: false
						}
					});
					adapter.setState(`accounts.${forename}_${surname}.parameter.${parameter}.status`, measurementStatus, true);

					
					// add parameter to already imported parameter
					addedParameter[parameter] = true;
				}
			});
		});
		adapter.log.info('LabCom adapter - fetching data completed');
		adapter.stop();
	}  
	catch (error) {
		adapter.log.error(error);
		adapter.stop();
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

	const endpoint = "https://backend.labcom.cloud/graphql"; //new url since 2022/09/02
	const token = adapter.config.labcomApiToken;
	const accountIds = adapter.config.labcomAccountIds;
	
	var accountFilter = ``;
	if(accountIds != 0){
		accountFilter = `(id:[${accountIds}])`;
	}
	
	adapter.log.debug('LabCom adapter - fetching data started');
	if(token && accountIds){
		getData(endpoint, token, accountFilter);
	} else {
		adapter.log.error('LabCom adapter - config incomplete!');
		adapter.stop();
	}
});



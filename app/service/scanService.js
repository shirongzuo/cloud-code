'use strict';

var jwt = require('jsonwebtoken');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
	security = require('../common/securityTools'),
	httpStatus = require('../common/httpStatus'),
    logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('scanErrLog');
	
const ScanModel = require('../model/scanModel');
const ObjectModel = require('../model/objectModel');

// The scan service.
var scanService = {};

// Add new scan
scanService.add = function(req, res) {
	if(!req.body.scan_record) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide a scan record.'})
    } else {
		try {
			// parse scan_record string into JSON object
			var scan_record = JSON.parse(req.body.scan_record)
		} catch (error) {
			logger.error(error)
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Incorrect Scan Record Format!' })
		}
			
		if (!req.body.signature){
			// check if the scan record contains uid and reader_id 
			if(!scan_record.uid || !scan_record.reader_id){
				res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide unique id and reader id in the scan record.'})
			} else {
				// check in object table, if uid exist or not
				ObjectModel.findOne({
					where: { uid: scan_record.uid }
				}).then(function(object) {
					if(!object) {
						// if not exist, broadcast scan message for new object
						var socketIo = req.app.get('socketIo')
						socketIo.sockets.emit('new_scan', { reader_id: req.body.reader_id, message: 'Object not Found!' })
						res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
						
					} else {
						// if exist, generate random challenge
						//AS:
						var random_challenge = 0;
						if(random_challenge == -1){
                            errLogger.error('Random_challenge Generated Error:\n' + random_challenge)
							res.status(httpStatus.SERVER_ERROR).json({ message: 'Random_challenge Generated Error!' })
						} else {
							// To make sure every random_challenge is valid once, 
							// save random_challenge temporarily and then delete it after receiving its signature
							var random_challenges = req.app.get('random_challenges')
							random_challenges.push(random_challenge)
							req.app.set('random_challenges', random_challenges)
							
							// return random_challenge
							res.status(httpStatus.OKAY).json({
								uid:scan_record.uid,
								reader_id:scan_record.reader_id,
								random_challenge:random_challenge
							})
						}
					}
				}).catch(function(error) {
                    errLogger.error('Pre-add Scan Record Error:\n' + error)
					res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
				})
			}
		} else {
			// check if the scan record contains uid, reader_id, and random_challenge
			if(!scan_record.uid || !scan_record.reader_id || !scan_record.random_challenge){
				res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide unique id, reader id and random challenge in the scan record.'})
			} else {
				// verify the scan info signature
				//AS:
				if(0 != 0){
					res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Signature!' })
				} else {
					// check if random_challenge exists in random_challenges
					var random_challenges = req.app.get('random_challenges')
					var index_random_challenge = random_challenges.indexOf(scan_record.random_challenge)
					if( index_random_challenge === -1){
						// if not exist, return error
						res.status(httpStatus.NOT_ALLOW).json({ message: 'Random Challenge Expired!' })
					} else {
						// if exist, delete this random_challenge
						random_challenges.splice(index_random_challenge, 1)
						
						// add record into database
						db.sync().then(function() {
							var newRecord = {
								uid: scan_record.uid,
								reader_id: scan_record.reader_id,
								signature: req.body.signature
							}

							return ScanModel.create(newRecord).then(function(record) {
								logger.debug(record.id)
								// generate token
								const record_data = {
									record_id: record.id,
									random_challenge: scan_record.random_challenge
								}
								var token = jwt.sign(record_data, config.keys.secret, {
									expiresIn: 60 // expires in 1 minute
								})
								// broadcast scan info
								var socketIo = req.app.get('socketIo')
								socketIo.sockets.emit('new_scan', { 
									record_id: record.id,
									uid: scan_record.uid,
									reader_id: scan_record.reader_id,
									record_token: token
								})
								
								// return scan info
								res.status(httpStatus.CREATED).json({
									record_id: record.id,
									record_token: token
								})
							})
						}).catch(function(error) {
                            errLogger.error('Add Scan Record Error:\n' + error)
							res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
						})
					}
				}
			}
		}
	}
}

// Get all scan info for one object
scanService.get = function(req, res) {
	var condition = {
		where: { uid: req.params.uid }
	}
	ScanModel.findAll(condition).then(function(records) {
		logger.debug(records)
		if(records.length == 0) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Records not Found!' })
		} else {
			var result = []
				records.forEach(function(record){
					result.push({
						id: record.id,
						//uid: record.uid,
						location: record.location,
						createdAt: record.createdAt
					})
				})
			res.status(httpStatus.OKAY).json(result)
		}
	}).catch(function(error) {
        errLogger.error('Get Scan Record Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

// Update scan location to the record
scanService.update = function(req, res){
	if(!req.body.location) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide scanned location.'})
    } else {
		console.log(req.params.id)
		ScanModel.findOne({
			where: { id: req.params.id }
		}).then(function(record) {
            if(!record) {
                res.status(httpStatus.NOT_FOUND).json({ message: 'Record not Found!' })
            } else {
				record.update({
					location: req.body.location
				}).then(function(){
					return res.status(httpStatus.OKAY).json({message: 'Scan Record Updated'})
				})
			}
		}).catch(function(error) {
            errLogger.error('Update Scan Record Error:\n' + error)
			res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
		})
	}
}

// Delete all scan info for one object
scanService.del = function(req, res) {
	ScanModel.findAll({
		where: { uid: req.params.uid }
	}).then(function(records) {
		if(records.length == 0) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Records not Found!' })
		} else {
			records.forEach(function(record){
				record.destroy()
			})
			res.status(httpStatus.OKAY).json({message: 'Scan Records Deleted'})
		}
	}).catch(function(error) {
        errLogger.error('Delete Scan Record Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

module.exports = scanService;
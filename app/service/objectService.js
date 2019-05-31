'use strict';

var jwt = require('jsonwebtoken'),
    multer = require('multer'),
    fs = require('fs'),
    merkleTools = require('../common/merkleTools');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
    ObjectModel = require('../model/objectModel'),
	ScanModel = require('../model/scanModel'),
	security = require('../common/securityTools'),
	httpStatus = require('../common/httpStatus'),
    logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('objectErrLog');

// The object service.
var objectService = {};

// Create new object
objectService.add = function(req, res) {
	if(!req.body.object_data || !req.body.signature) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Invalid Parameters Provided!'})
    } else {
		logger.debug(req.body.object_data)
		try {
			// parse object_data string into JSON object
			var object_data = JSON.parse(req.body.object_data)
			//logger.debug(object_data.uid)
		} catch (error) {
			logger.error(error)
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Incorrect Object Info Format!' })
		}
		
		// check if the object_data contains uid and object_info
        if(!object_data.uid || !object_data.object_info){
            res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide unique id and object_info in the object_data.'})
        } else {
            // merge object_info and hidden_info 
            if(object_data.hidden_info && object_data.hidden_info != "" && object_data.hidden_info != "{}") {
                var info = object_data.object_info.substr(0, object_data.object_info.length-1)+ ',' + object_data.hidden_info.substr(1, object_data.hidden_info.length)
            } else {
                var info = object_data.object_info
            }
            logger.debug(info)
            
            // get merkle proof
            var merkle_json = merkleTools.getMerkleProof(info, 0)
            logger.debug(merkle_json.merkle_proof)
			
			// verify the object info signature
            logger.debug(req.body.signature)
            if(security.verifySignature(merkle_json.merkle_proof, req.body.signature, object_data.uid) != 0){
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Signature!' })
			} else {
				// check in object table, if uid exist or not
				ObjectModel.findOne({
					where: { uid: object_data.uid }
				}).then(function(object) {
					if(object) {
						res.status(httpStatus.NOT_ALLOW).json({ message: 'Object Already Exists!' })
					} else {
						// add object data into database
						db.sync().then(function() {
							object_data.signature = req.body.signature
							ObjectModel.create(object_data).then(function() {
								res.status(httpStatus.CREATED).json({ message: 'New Object Added!' })
							})
						})
					}
				}).catch(function(error) {
                    errLogger.error('Add Object Info Error:\n' + error)
					res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
				})
			}
		}
	}
}

// Add storage
var storage = multer.diskStorage({
  destination: function(req, file, callback){
    if(file.fieldname == "image"){
        callback(null, "./public/image")
    } else {
        callback(null, "./public/pdf")
    }
  },
  filename: function(req, file, callback){
	console.log(req.uid)
    if(file.fieldname == "image"){
        callback(null, req.uid + ".jpg")
    } else {
        callback(null, req.uid + ".pdf")
    }
  }
})

var upload = multer({
  storage: storage
}).fields([{name:'image', maxCount: 1}, {name:'pdf', maxCount: 1}])

// Upload object image
objectService.uploadImage = function(req, res){
	ObjectModel.findOne({
		where: { uid: req.params.uid }
	}).then(function(object) {
		if(!object) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
		} else {
			req.uid = req.params.uid
			// upload image
			upload(req, res, function(err){
				logger.debug(req.files['image'][0]['filename'])
				if(err) {
					errLogger.error('Upload Image Error:\n' + err)
					return res.status(httpStatus.SERVER_ERROR).json({message: 'Upload Failed'})
				} 
				// update object data
				object.update({
					image_path: '/image/'+req.files['image'][0]['filename'],
				}).then(function(){
					res.status(httpStatus.OKAY).json({
                        image_path: '/image/'+req.files['image'][0]['filename']
                    })
				})
			})
		}
	}).catch(function(error) {
        errLogger.error('Upload Image Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

// Upload object image and pdf
objectService.uploadFiles = function(req, res){
	ObjectModel.findOne({
		where: { uid: req.params.uid }
	}).then(function(object) {
		if(!object) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
		} else {
			req.uid = req.params.uid
			// upload image
			upload(req, res, function(err){
				logger.debug(req.files['image'][0]['filename'])
                logger.debug(req.files['pdf'][0]['filename'])
				if(err) {
					errLogger.error('Upload Files Error:\n' + err)
					return res.status(httpStatus.SERVER_ERROR).json({message: 'Upload Failed'})
				} 
				// update object data
				object.update({
					image_path: '/image/'+req.files['image'][0]['filename'],
                    pdf_path: '/pdf/'+req.files['pdf'][0]['filename'],
				}).then(function(){
					res.status(httpStatus.OKAY).json({
                        image_path: '/image/'+req.files['image'][0]['filename'],
                        pdf_path: '/pdf/'+req.files['pdf'][0]['filename'],
                    })
				})
			})
		}
	}).catch(function(error) {
        errLogger.error('Upload Files Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

// Receive object info
objectService.retrieve = function(req, res) {
	// obtain and return object info
	ObjectModel.findOne( {
		where: { uid: req.params.uid }
	}).then(function(object) {
		if(!object) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
		} else {
			res.status(httpStatus.OKAY).json(object)
		}
	}).catch(function(error) {
        errLogger.error('Get Object Info Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

// Get object info using token
objectService.get = function(req, res) {
	if(!req.headers.recordtoken){
		res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'No record token provided!' })
	} else {
		// verifies secret and checks expiry
		jwt.verify(req.headers.recordtoken, config.keys.secret, function(err, decoded) {      
			if (err) {
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Scan Token Expired!' })
			} else {
				logger.debug(decoded)
				// obtain scan record
				ScanModel.findOne({
					where: { id: decoded.record_id }
				}).then(function(record) {
					if(!record) {
						res.status(httpStatus.NOT_FOUND).json({ message: 'Scan Record Not Found!' })
					} else {
						// verify the unique id
						if (record.uid != req.params.uid){
							res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Invalid Parameters Provided!' })
						} else {
							var scan_record_info = "{\"uid\": \"" + record.uid + "\", " + "\"reader_id\": \"" + record.reader_id + "\", " + "\"random_challenge\": \"" + decoded.random_challenge + "\"}"
							// verify the scan info signature
							if(security.verifySignature(scan_record_info, record.signature, record.uid) != 0){
								res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Signature!' })
							} else {
								// obtain and return object info
								ObjectModel.findOne( {
									where: { uid: req.params.uid }
								}).then(function(object) {
									if(!object) {
										res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
									} else {
										res.status(httpStatus.OKAY).json(object)
									}
								})
							}
						}
					}
				}).catch(function(error) {
                    errLogger.error('Get Object Info Error:\n' + error)
					res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
				})	
			}
		})
	}
}

// Get merkle proof
objectService.getProof = function(req, res){
	ObjectModel.findOne({
		where: { uid: req.params.uid }
	}).then(function(object) {
		if(!object) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
		} else {
            // merge object_info and hidden_info 
            if(object.hidden_info && object.hidden_info != "" && object.hidden_info != "{}"){
                var info = object.object_info.substr(0, object.object_info.length-1)+ ',' + object.hidden_info.substr(1, object.hidden_info.length)
            } else {
                var info = object.object_info
            }
            logger.debug(info)
            
            // get merkle proof
			var merkle_json = merkleTools.getMerkleProof(info, req.params.id)
			logger.debug(merkle_json)
            
			res.status(httpStatus.OKAY).json(merkle_json)
		}
	}).catch(function(error) {
        errLogger.error('Get Merkle Proof Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

// Update object info
objectService.update = function(req, res){
	if(!req.body.object_data || !req.body.signature) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Invalid Parameters Provided!'})
    } else {
		logger.debug(req.body.object_data)
		try {
			// parse object_data string into JSON object
			var object_data = JSON.parse(req.body.object_data)
		} catch (error) {
			logger.error(error)
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Incorrect Object Info Format!' })
		}

		// check if the object_data contains uid and object_info
		if(!object_data.uid || !object_data.object_info){
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide unique id and object_info in the object_data.'})
		} else {
            // merge object_info and hidden_info 
            if(object_data.hidden_info && object_data.hidden_info != "" && object_data.hidden_info != "{}"){
                var info = object_data.object_info.substr(0, object_data.object_info.length-1)+ ',' + object_data.hidden_info.substr(1, object_data.hidden_info.length)
            } else {
                var info = object_data.object_info
            }
            logger.debug(info)
            
			// get merkle proof
			var merkle_json = merkleTools.getMerkleProof(info, 0)
			logger.debug(merkle_json.merkle_proof)
			
			// verify the object data signature
			if(security.verifySignature(merkle_json.merkle_proof, req.body.signature, req.params.uid) != 0){
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Signature!' })
			} else {
				// obtain the specific object
				ObjectModel.findOne({
					where: { uid: req.params.uid }
				}).then(function(object) {
					if(!object) {
						res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
					} else {
						// update object data
						object_data.signature = req.body.signature
						object.update(object_data).then(function(){
							res.status(httpStatus.OKAY).json({message: 'Object Data Updated'})
						})
					}
				}).catch(function(error) {
                    errLogger.error('Update Object Info Error:\n' + error)
					res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
				})
			}
		}
	}
}

// Delete object info
objectService.del = function(req, res) {
	if(!req.body.object_data || !req.body.signature) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Invalid Parameters Provided!'})
    } else {
		logger.debug(req.body.object_data)
		try {
			// parse object_data string into JSON object
			var object_data = JSON.parse(req.body.object_data)
		} catch (error) {
			logger.error(error)
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Incorrect Object Info Format!' })
		}
		
		// check if the object_data contains uid and object_info
		if(!object_data.uid || !object_data.object_info){
			res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide unique id and object_info in the object_data.'})
		} else {
            // merge object_info and hidden_info 
            if(object_data.hidden_info && object_data.hidden_info != "" && object_data.hidden_info != "{}"){
                var info = object_data.object_info.substr(0, object_data.object_info.length-1)+ ',' + object_data.hidden_info.substr(1, object_data.hidden_info.length)
            } else {
                var info = object_data.object_info
            }
            logger.debug(info)
            
			// get merkle proof
			var merkle_json = merkleTools.getMerkleProof(info, 0)
			logger.debug(merkle_json.merkle_proof)
			
			// verify the object data signature
			if(security.verifySignature(merkle_json.merkle_proof, req.body.signature, req.params.uid) != 0){
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Signature!' })
			} else {
				// obtain the specific object
				ObjectModel.findOne({
					where: { uid: req.params.uid }
				}).then(function(object) {
					if(!object) {
						res.status(httpStatus.NOT_FOUND).json({ message: 'Object not Found!' })
					} else {
						// verify the object info
						if(object.object_info != object_data.object_info || object.hidden_info != object_data.hidden_info){
							res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Incorrect Object Info!' })
						} else {
							// delete object data
							object.destroy().then(function(){
								// delete object image
								fs.unlink("./public/image/"+ req.params.uid + ".jpg", function(err){
									if (err) {
										console.log("Failed to delete local image:" + err)
									}						
								})
                                // delete object pdf
								fs.unlink("./public/pdf/"+ req.params.uid + ".pdf", function(err){
									if (err) {
										console.log("Failed to delete local pdf:" + err)
									}						
								})
                                res.status(httpStatus.OKAY).json({message: 'Object Data Deleted!'})
							})
						}
					}
				}).catch(function(error) {
                    errLogger.error('Delete Object Info Error:\n' + error)
					res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
				})
			}
		}
	}
}

module.exports = objectService;
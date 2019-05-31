'use strict';

var jwt = require('jsonwebtoken');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
	security = require('../common/securityTools'),
	httpStatus = require('../common/httpStatus'),
    logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('companyErrLog');
	
const CompanyModel = require('../model/companyModel');
const ObjectModel = require('../model/objectModel');

// The Company service.
var companyService = {};

// Get all Company info for one object
companyService.get = function(req, res) {
    var condition = {
        where: { 
            $or: [
                { id: req.body.id },
                { name: req.body.name }
            ]
        }
	}
	CompanyModel.findAll(condition).then(function(records) {
		logger.debug(records)
		if(!records) {
			res.status(httpStatus.NOT_FOUND).json({ message: 'Company not Found!' })
		} else {
			res.status(httpStatus.OKAY).json(records)
		}
	}).catch(function(error) {
        errLogger.error('Get Company Record Error:\n' + error)
		res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
	})
}

module.exports = companyService;
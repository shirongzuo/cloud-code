// The object model.
'use strict'; 

var Sequelize = require('sequelize');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
    logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('objectErrLog');

// 1: The model schema.
var modelDefinition = {
    uid: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
		primaryKey: true
    },

    image_path: {
        type: Sequelize.STRING,
        allowNull: true
    },
    
    pdf_path: {
        type: Sequelize.STRING,
        allowNull: true
    },
	
	object_info: {
		type: Sequelize.STRING(4096),
        allowNull: true
	},
    
    hidden_info: {
		type: Sequelize.STRING(2048),
        allowNull: true
	},
	
	signature: {
        type: Sequelize.STRING,
        allowNull: true
    },
	
	reserve: {
        type: Sequelize.STRING,
        allowNull: true
    }
};

// 2: The model options.
var modelOptions = {
    instanceMethods: {},
    hooks: {}
};

// 3: Define the object model.
var ObjectModel = db.define('object', modelDefinition, modelOptions);

// 4: Initialize test object
ObjectModel.findOne({ where: { uid: config.test_object.uid } }).then(function(user) {
	if(user) {
		logger.warn('Dummy object already exists!')
	} else {
		ObjectModel.sync().then(function() {
			return ObjectModel.create(config.test_object).then(function() {
				logger.info('Dummy object created!')
			})
		})
	}
}).catch(function(error) {
	ObjectModel.sync().then(function() {
		return ObjectModel.create(config.test_object).then(function() {
			console.log('Dummy object created!')
		})
	}).catch(function(error) {
		logger.error('Dummy Object Creation Error!')
        errLogger.error('Dummy Object Creation Error:\n' + error)
	})
})

module.exports = ObjectModel;
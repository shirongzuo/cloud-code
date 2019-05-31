// The scan model.
'use strict'; 

var Sequelize = require('sequelize');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db');

// 1: The model schema.
var modelDefinition = {
    uid: {
        type: Sequelize.STRING,
        allowNull: false
    },

    location: {
        type: Sequelize.STRING,
        allowNull: true
    },
	
	reader_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
	
	signature: {
        type: Sequelize.STRING,
        allowNull: false
    },
};

// 2: The model options.
var modelOptions = {
    instanceMethods: {},
    hooks: {}
};

// 3: Define the scan model.
var scanModel = db.define('scan', modelDefinition, modelOptions);

module.exports = scanModel;
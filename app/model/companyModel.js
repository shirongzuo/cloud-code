// The company model.
'use strict'; 

var Sequelize = require('sequelize');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db');

// 1: The model schema.
var modelDefinition = {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
	
	master_pubkey: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    
    status: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
};

// 2: The model options.
var modelOptions = {
    instanceMethods: {},
    hooks: {}
};

// 3: Define the company model.
var companyModel = db.define('company', modelDefinition, modelOptions);

module.exports = companyModel;
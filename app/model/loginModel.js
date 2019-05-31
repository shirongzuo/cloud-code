// The Transaction model.
'use strict'; 

var Sequelize = require('sequelize'),
    bcrypt = require('bcryptjs');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
    userModel = require('./userModel');

// 1: The model schema.
var modelDefinition = {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
			model: userModel,
			key: 'id',
		}
    },
    sys_info: {
		type: Sequelize.STRING,
        allowNull: true
	},
    result: {
		type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
	}
};

// 2: The model options.
var modelOptions = {
    instanceMethods: {},
    hooks: {}
};

// 3: Define the login record model.
var LoginModel = db.define('logins', modelDefinition, modelOptions);

module.exports = LoginModel;
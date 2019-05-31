// The User model.
'use strict'; 

var Sequelize = require('sequelize'),
    bcrypt = require('bcryptjs');

var config = require('../config').get(process.env.NODE_ENV),
    logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('userErrLog'),
    db = require('../db');

// 1: The model schema.
var modelDefinition = {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },

    password: {
        type: Sequelize.STRING,
        allowNull: false
    },

    role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: config.userRoles.user
    },
    
    company_name: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    
    description: {
		type: Sequelize.STRING(2048),
        allowNull: true
	},
    
    sys_info: {
		type: Sequelize.STRING(4096),
        allowNull: true
	},
    
    current_dev: {
		type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
        
	},
    
    max_dev: {
		type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
	},
    
    is_login: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    
    is_reset: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
};

// 2: The model options.
var modelOptions = {
    instanceMethods: {
        comparePasswords: comparePasswords
    },
    hooks: {
        beforeValidate: hashPassword,
        beforeUpdate: function(user, options, fn) {
            // disable validate again when updating user info
            options.validate = false
            fn(null,user)
        }
    }
};

// 3: Define the User model.
var UserModel = db.define('user', modelDefinition, modelOptions);

// Initialize administrator account
UserModel.findOne({ where: { username: config.admin.username } }).then(function(user) {
	if(user) {
		logger.warn('Admin already exists!')
	} else {
		UserModel.sync().then(function() {
			return UserModel.create(config.admin).then(function() {
				logger.info('Admin Account created!')
			});
		});
	}
}).catch(function(error) {
	UserModel.sync().then(function() {
		return UserModel.create(config.admin).then(function() {
			logger.info('Admin Account created!')
		})
	}).catch(function(error) {
        logger.error('Administrator Account Creation Error!')
        errLogger.error('Administrator Account Creation Error:\n' + error)
	})
})
		
// Compares two passwords.
function comparePasswords(password, callback) {
    bcrypt.compare(password, this.password, function(error, isMatch) {
        if(error) {
            return callback(error)
        }
        return callback(null, isMatch)
    })
}

// Hashes the password for a user object.
function hashPassword(user) {
    if(user.changed('password')) {
        //logger.debug(user.password)
        return bcrypt.hash(user.password, 10).then(function(password) {
            //logger.debug(password)
            user.password = password
        })
    }
}

module.exports = UserModel;


// Application configuration.
'use strict';

var keys = {
    secret: '/jVdfUX+u/Kn3qPY4+ahjwQgyV5UhkM5cdh1i2xhozE=' // Not anymore...
};

var email = {
    host: 'mail.inpiasia.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'appsupport@inpiasia.com', // generated ethereal user
        pass: '16MarsRoad' // generated ethereal password
    },
    tls: {
        rejectUnauthorized: false
    },
    defaultFromAddress: 'Inpiasia Support<appsupport@inpiasia.com>'
}

var gmail_email = {
    service: 'gmail',
    auth: {
        user: 'inpiasia.apps@gmail.com', // generated ethereal user
        pass: '16MarsRoad' // generated ethereal password
    },
    defaultFromAddress: 'Inpiasia Support<inpiasia.apps@gmail.com>'
};

var userRoles = {
    admin: 1,           // ...001
    super_user:  2,     // ...010
    user: 4             // ...100
};

var accessLevels = {
    user: userRoles.user | userRoles.super_user | userRoles.admin,    // ...111
    super_user: userRoles.super_user | userRoles.admin,                 // ...011
    admin: userRoles.admin                                              // ...001
};

var admin = {
	username: 'admin',
    email: 'example@mostechnologes.com',
	password: 'password',
	role: userRoles.admin
};

var test_object = {
	uid: 'dummy'
};

var config = {
    production: {
        db: {
            user: 'root', 
            password: 'blue_stapler',
            name: 'krypto_database',
            details: {
                // host: 'mos-database.cwuyregvh4ux.ap-southeast-2.rds.amazonaws.com',
                host: '127.0.0.1',

                port: 3306,
                dialect: 'mysql',
            }
        },
        port: 3000,
        keys: keys,
        email: email,
        userRoles: userRoles,
        accessLevels: accessLevels,
        admin: admin,
        test_object: test_object    
    },
    production_chinacloud: {
        db: {
            user: 'root', 
            password: 'bezzle94037',
            name: 'krypto_database',
            details: {
                host: '127.0.0.1',
                port: 3306,
                dialect: 'mysql',
            }
        },
        port: 3000,
        keys: keys,
        email: email,
        userRoles: userRoles,
        accessLevels: accessLevels,
        admin: admin,
        test_object: test_object    
    },
    test_chinacloud: {
        db: {
            user: 'root', 
            password: 'bezzle94037',
            name: 'krypto_database_test',
            details: {
                host: '127.0.0.1',
                port: 3306,
                dialect: 'mysql',
            }
        },
        port: 4000,
        keys: keys,
        email: email,
        userRoles: userRoles,
        accessLevels: accessLevels,
        admin: admin,
        test_object: test_object    
    },
    test: {
        db: {
            user: 'root',
            password: 'blue_stapler',
            name: 'krypto_database_test',
            details: {
                host: '127.0.0.1',
                port: 3306,
                dialect: 'mysql',
            }
        },
        port: 4000,
        keys: keys,
        email: email,
        userRoles: userRoles,
        accessLevels: accessLevels,
        admin: admin,
        test_object: test_object    
    },
    development: {
        db: {
            user: 'root', 
            password: 'blue_stapler',
            name: 'krypto_database',
            details: {
                host: '192.168.4.150',
                port: 3306,
                dialect: 'mysql',
            }
        },
        port: 5000,
        keys: keys,
        email: email,
        userRoles: userRoles,
        accessLevels: accessLevels,
        admin: admin,
        test_object: test_object
    }
}

exports.get = function get(env) {
  return config[env] || config.production;
}
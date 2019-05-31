var log4js = require('log4js');

// Initialise logger
log4js.configure({
	appenders: {
		userErrLogs: {
			type: 'dateFile', 
			filename: 'logs/user.err.log',
			pattern: 'yyyy-MM-hh',
			maxLogSize: 10*1024*1024,
			numBackups: 5
		},
        loginErrLogs: {
			type: 'dateFile', 
			filename: 'logs/login.err.log',
			pattern: 'yyyy-MM-hh',
			maxLogSize: 10*1024*1024,
			numBackups: 5
		},
		objectErrLogs: {
			type: 'dateFile', 
			filename: 'logs/object.err.log',
			pattern: 'yyyy-MM-hh',
			maxLogSize: 10*1024*1024,
			numBackups: 5
		},
		scanErrLogs: {
			type: 'dateFile', 
			filename: 'logs/scan.err.log',
			pattern: 'yyyy-MM-hh',
			maxLogSize: 10*1024*1024,
			numBackups: 5
		},
		console: { type:'console' }
	},
	categories: {
		userErrLog: { appenders: ['userErrLogs', 'console'], level: 'error' },
        loginErrLog: { appenders: ['loginErrLogs', 'console'], level: 'error' },
		objectErrLog: { appenders: ['objectErrLogs', 'console'], level: 'error' },
		scanErrLog: { appenders: ['scanErrLogs', 'console'], level: 'error' },
		default: { appenders: ['console'], level: 'info'} //trace, error, info, warning, error
	}
});

module.exports.getLogger = function(category){
	const logger = log4js.getLogger(category);
	return logger;
}
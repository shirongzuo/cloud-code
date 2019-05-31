'use strict';

// NPM dependencies.
var express = require('express'),
    bodyParser = require('body-parser'),
    sequelize = require('sequelize'),
    passport = require('passport'),
    jwt = require('jsonwebtoken'),
    path = require('path'),
	config = require('./app/config').get(process.env.NODE_ENV),
	log4js = require('log4js'),
	db = require('./app/db');
	
// App related modules.
var hookJWTStrategy = require('./app/common/passportStrategy');
var info = require('./app/common/info');
var logger = require('./app/common/logger').getLogger();
var httpStatus = require('./app/common/httpStatus');

// Connect database
db.connect();

// Initialise app.
var app = express();

// Parse as url encoded and json.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Hook up the HTTP logger.
app.use(log4js.connectLogger(logger, {level:'auto', format: ':method :url :status'}));

// Hook up Passport.
app.use(passport.initialize());

// Hook the passport JWT strategy.
hookJWTStrategy(passport);

// Set the static files location
app.use(express.static(path.join(__dirname+ '/public')));

// Enable cross-origin resource sharing (COR)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT,GET,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, cache-control, Content-Type, Accept, Authorization, RegisterToken, ResetToken");
  next();
});

// Bundle API routes.
app.use('/user', require('./app/router/user')(passport));
app.use('/object', require('./app/router/object')(passport));
app.use('/scan', require('./app/router/scan')(passport));
app.use('/login-info', require('./app/router/login')(passport));
app.use('/company', require('./app/router/company')(passport));

app.get('/about', function(req, res) {
    res.send({
      name: info.getAppName(),
      version: info.getAppVersion(),
      author: info.getAppVendor(),
      description: info.getAppDescription(),
    });
});

// Catch all route.
app.all('*', function(req, res) {
    res.status(httpStatus.BAD_REQUEST).json({ message: 'Bad Request' });
});

app.all('*', function(req, res) {
	if(req.method == "OPTIONS"){
		res.status(httpStatus.OKAY);
	}
})

// Print logo header
info.printHeaderAndLogo();

// Start the server.
var server = app.listen(config.port, function() {
    logger.info('Server is listening http://localhost:'+config.port);
});

// Hook up socket io server
var socketIo = require('socket.io').listen(server);
app.set('socketIo', socketIo);
logger.info('Socket server is listening');

// Set random_challenge array
var random_challenges = [];
app.set('random_challenges', random_challenges);	

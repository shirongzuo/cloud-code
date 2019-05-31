'use strict';

var router = require('express').Router();

var config = require('../config').get(process.env.NODE_ENV),
    loginService = require('../service/loginService'),
    allowOnly = require('../common/routesHelper').allowOnly

var loginRouter = function(passport) {
    //router.post('', loginService.add)
	router.get('', passport.authenticate('jwt', { session: false }), loginService.get)
	//router.put('/:id', passport.authenticate('jwt', { session: false }), loginService.update)
    router.delete('', passport.authenticate('jwt', { session: false }), loginService.del)
    
    return router;
};

module.exports = loginRouter;
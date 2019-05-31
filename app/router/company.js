'use strict';

var router = require('express').Router();

var config = require('../config').get(process.env.NODE_ENV),
    companyService = require('../service/companyService'),
    allowOnly = require('../common/routesHelper').allowOnly

var companyRouter = function(passport) {
	
    //router.post('',  passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, companyService.add))
	router.post('', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, companyService.get))
	//router.put('/:id', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, companyService.update))
    //router.delete('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.admin, companyService.del))

    return router;
};

module.exports = companyRouter;
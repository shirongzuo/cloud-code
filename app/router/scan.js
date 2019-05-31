'use strict';

var router = require('express').Router();

var config = require('../config').get(process.env.NODE_ENV),
    scanService = require('../service/scanService'),
    allowOnly = require('../common/routesHelper').allowOnly

var scanRouter = function(passport) {
	
    router.post('',  passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, scanService.add))
	router.get('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.super_user, scanService.get))
	router.put('/:id', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, scanService.update))
    router.delete('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.admin, scanService.del))

    return router;
};

module.exports = scanRouter;
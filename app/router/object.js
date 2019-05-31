'use strict';

var router = require('express').Router();

var config = require('../config').get(process.env.NODE_ENV),
    objectService = require('../service/objectService'),
    allowOnly = require('../common/routesHelper').allowOnly

var ObjectRouter = function(passport) {
	
    router.post('', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.super_user, objectService.add))
    router.post('/:uid/image', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.super_user, objectService.uploadImage))
    router.post('/:uid/files', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.super_user, objectService.uploadFiles))
    
	router.get('/:uid/reader/:id', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, objectService.get))
	router.get('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, objectService.retrieve))
	router.get('/:uid/proof/:id', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.user, objectService.getProof))
    
	router.put('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.admin, objectService.update))
    router.delete('/:uid', passport.authenticate('jwt', { session: false }), allowOnly(config.accessLevels.admin, objectService.del))
	
    return router;
};

module.exports = ObjectRouter;
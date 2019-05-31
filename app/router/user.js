'use strict';

var router = require('express').Router();

var config = require('../config').get(process.env.NODE_ENV),
    userService = require('../service/userService'),
    allowOnly = require('../common/routesHelper').allowOnly

var UserRouter = function(passport) {
    router.post('/pre-signup', userService.preSignUp)
    router.post('/signup', userService.signUp)
    
    router.post('/login', userService.logIn)
	router.get('/logout', passport.authenticate('jwt', { session: false }), userService.logOut)
    
    router.get('/info', passport.authenticate('jwt', { session: false }), userService.getInfo)
    router.put('/info', passport.authenticate('jwt', { session: false }), userService.updateInfo)
    
    router.put('/pwd', passport.authenticate('jwt', { session: false }), userService.updatePwd)
    router.post('/pwd/pre-reset', userService.preResetPwd)
    router.put('/pwd/reset', userService.resetPwd)
    
    router.delete('/info', passport.authenticate('jwt', { session: false }), userService.del)
    
    return router
};

module.exports = UserRouter;
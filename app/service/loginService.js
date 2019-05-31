'use strict';

var Sequelize = require('sequelize'),
    jwt = require('jsonwebtoken');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
    LoginModel = require('../model/loginModel'),
	httpStatus = require('../common/httpStatus'),
    UserModel = require('../model/userModel'),
    errLogger = require('../common/logger').getLogger('loginErrLog'),
    transporter = require('../common/emailTools');

// The login service.
var loginService = {};

loginService.add = function(user_id, result, sys_info){
    
    db.sync().then(function() {
        var newlogin = {
            user_id: user_id,
            result: result,
            sys_info: sys_info
        }
        return LoginModel.create(newlogin).then(function() {
            return 0
        })
    }).catch(function(error) {
        errLogger.error('Add Login Info Error:\n' + error)
        return -1
    })
}
// Add new login
/*
loginService.add = function(req, res) {
	if(!req.body.username || !req.body.result) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide a user email or username and its login result.'})
    } else {
        // find potential user
        var potentialUser = { 
            where: {
                $or: [
                    { username: req.body.username },
                    { email: req.body.username }
                ]
            } 
        }
        UserModel.findOne(potentialUser).then(function(user) {
            if(!user) {
                res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
            } else {
                db.sync().then(function() {
                    var newlogin = {
                        user_id: user.id,
                        result: req.body.result,
                        sys_info: req.body.sys_info
                    }
                    return LoginModel.create(newlogin).then(function() {
                        res.status(httpStatus.CREATED).json({ message: 'Login record added!' })
                    })
                })
            }
        }).catch(function(error) {
            errLogger.error('Add Login Info Error:\n' + error)
            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
        })
	}
}
*/
// Get login info
loginService.get = function(req, res) {
    var condition = {
        where: { user_id: req.user.id },
        order: [['id', 'DESC']]
    }
    LoginModel.findAll(condition).then(function(login) {
        if(!login) {
            res.status(httpStatus.NOT_FOUND).json({ message: 'Login record not Found!' })
        } else {
            var result = []
            login.forEach(function(ln){
                result.push({
                    id: ln.id,
                    user_id: ln.user_id,
                    sys_info: ln.sys_info,
                    result: ln.result,
                    createdAt: ln.createdAt
                })
            })
            res.status(httpStatus.OKAY).json({
                login_info: result
            })
        }
    }).catch(function(error) {
        errLogger.error('Get Login Info Error:\n' + error)
        res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
    })
}

// Update login info
/*
loginService.update = function(req, res){
	return res.status(httpStatus.OKAY).json({message: 'Todo...'})
}
*/

// Delete login info
loginService.del = function(req, res) {
    var condition = {
        where: { user_id: req.user.id },
        order: [['id', 'DESC']]
    }
    LoginModel.findAll(condition).then(function(login) {
        if(!login) {
            res.status(httpStatus.NOT_FOUND).json({ message: 'Login record not Found!' })
        } else {
            login.forEach(function(ln){
                ln.destroy()
            })
            return res.status(httpStatus.OKAY).json({message: 'Delete Successfully'})
        }
    }).catch(function(error) {
        errLogger.error('Delete Login Info Error:\n' + error)
        res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
    })
}

module.exports = loginService;
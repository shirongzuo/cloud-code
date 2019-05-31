'use strict';

var jwt = require('jsonwebtoken');

var config = require('../config').get(process.env.NODE_ENV),
    db = require('../db'),
    Op = require('Sequelize').Op,
    UserModel = require('../model/userModel'),
    loginService = require('../service/loginService'),
	httpStatus = require('../common/httpStatus'),
	logger = require('../common/logger').getLogger(),
    errLogger = require('../common/logger').getLogger('userErrLog'),
    transporter = require('../common/emailTools'),
    validator = require("email-validator");

// The user service.
var userService = {};

// User Pre-SignUp
userService.preSignUp = function(req, res) {
    if(!req.body.username || !req.body.email || !validator.validate(req.body.email) || !req.body.software) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide a username, an valid email and the name of the software.'})
    } else {
        UserModel.findOne({
            where: {
                $or: [
                    { username: req.body.username },
                    { email: req.body.email }
                ]
            } 
        }).then(function(user) {
            if(user) {
                res.status(httpStatus.NOT_ALLOW).json({ message: 'Username and email already exists!' })
            } else {
                const user_data = {
                    username: req.body.username,
                    email: req.body.email
                }
                // generate RegisterToken
                var token = jwt.sign(user_data, config.keys.secret, {
                    expiresIn: 60 * 10// expires in 10 minute
				})
                logger.debug(token)
                
                // Email the ending characters of RegisterToken
                var end_token = token.substr(token.length-6, token.length)
                transporter.sendActivationCode(req.body.email, req.body.username, req.body.software, end_token)
                
                // Return the rest of RegisterToken
                var pre_token = token.substr(0, token.length-6)
                res.status(httpStatus.OKAY).json({
                    pre_token: pre_token 
                })
            }
        }).catch(function(error) {
            errLogger.error('User Pre-SignUp Error:\n' + error)
            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
        })
    }
}

// User SignUp
userService.signUp = function(req, res) {
    if(!req.headers.registertoken){
		res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'No register token provided!' })
	} 
    else if(!req.body.username ||!req.body.email || !validator.validate(req.body.email) || !req.body.password || !req.body.role_id) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide all the user data.'})
    } 
    else {
        // verify register token
        jwt.verify(req.headers.registertoken, config.keys.secret, function(err, decoded) {      
			if (err) {
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Register Token Expired!' })
			} else {
                // verify username and email
                logger.debug(decoded)
                if (decoded.username != req.body.username || decoded.email != req.body.email){
                    res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Invalid username and email provided!' })
                } else {
                    // create a user account in the database
                    db.sync().then(function() {
                        var newUser = req.body
                        logger.debug(newUser)
                        return UserModel.create(newUser).then(function() {
                            res.status(httpStatus.CREATED).json({ message: 'Account created!' })
                        })
                    }).catch(function(error) {
                        errLogger.error('User SignUp Error:\n' + error)
                        res.status(httpStatus.NOT_ALLOW).json({ message: 'Username already exists!' })
                    })
                }
            }
        })
    }
}

// User Login
userService.logIn = function(req, res) {
    if(!req.body.username || !req.body.password) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Username or email, and password are needed!' })
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
                if(loginService.add(null,0, null) == -1){
                    res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
                } 
                res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
            } else {
                // check password
                user.comparePasswords(req.body.password, function(error, isMatch) {
                    if(isMatch && !error) {
                        // update is_login field
                        logger.debug(user)
                        user.update({
                            is_login: true
                        }).then(function(){
                            // generate login token 
                            var token = jwt.sign(
                                { username: user.username },
                                config.keys.secret,
                                { expiresIn: '24h' }
                            )
                            logger.debug(token)
                            // add login record
                            if(loginService.add(user.id, 1, user.sys_info) == -1){
                                res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
                            }           
                            // reply login token
                            res.status(httpStatus.OKAY).json({
                                token: 'JWT ' + token
                            })
                        })                     
                    } else {
                        if(loginService.add(user.id,0, user.sys_info) == -1){
                            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
                        } 
                        res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid Username or Password!' })
                    }
                })
            }
        }).catch(function(error) {
            errLogger.error('User Login Error:\n' + error)
            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
        })
    }
}

// User Logout
userService.logOut = function(req, res){
    logger.debug(req.user)
    // update is_login field
    req.user.update({
        is_login: false
    }).then(function(){
        delete req.user
        return res.status(httpStatus.OKAY).json({message: 'Logout Successfully'})
    }).catch(function(error) {
        errLogger.error('User Logout Error:\n' + error)
        res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
    })  
}

// Get User Info
userService.getInfo = function(req, res) {
    logger.debug(req.user)
    if(req.user){
        // reply user info without password
        return res.status(httpStatus.OKAY).json({
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role_id: req.user.role_id,
            company_name: req.user.company_name,
            sys_info: req.user.sys_info,
            description: req.user.description,
            current_dev: req.user.current_dev,
            max_dev: req.user.max_dev,
            createdAt: req.user.createdAt
        })
    } else {
        return res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
    }
}

// User Update Info
userService.updateInfo = function(req, res) {
    if(!req.body.username && !req.body.role_id && !req.body.sys_info && !req.body.description && !req.body.current_dev && !req.body.max_dev) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide new user data.'})
    } 
    else {
        if(!req.body.username){
            req.body.username = req.user.username
        }
        if(!req.body.role_id){
            req.body.role_id = req.user.role_id
        }
        if(!req.body.sys_info){
            req.body.sys_info = req.user.sys_info
        }
        if(!req.body.description){
            req.body.description = req.user.description
        }
        if(!req.body.current_dev){
            req.body.current_dev = req.user.current_dev
        }
        if(!req.body.max_dev){
            req.body.max_dev = req.user.max_dev
        }
        // update password
        logger.debug(req.user)
        req.user.update({
            role_id: req.body.role_id,
            sys_info: req.body.sys_info,
            description: req.body.description,
            current_dev: req.body.current_dev,
            max_dev: req.body.max_dev
        }).then(function(){
            res.status(httpStatus.OKAY).json({message: 'User Info Updated'})
        }).catch(function(error) {
            errLogger.error('User Update Info Error:\n' + error)
            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
        })
    }
}

// User Update Password
userService.updatePwd = function(req, res) {
    if(!req.body.old_password || !req.body.new_password) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide the old password and a new password.'})
    } 
    else {
        // check password
        req.user.comparePasswords(req.body.old_password, function(error, isMatch) {
            if(isMatch && !error) {
                // update password
                logger.debug(req.user)
                req.user.update({
                    password: req.body.new_password
                }).then(function(){
                    res.status(httpStatus.OKAY).json({message: 'User Password Updated'})
                }).catch(function(error) {
                    errLogger.error('User Update Password Error:\n' + error)
                    res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
                })
            } else {
                res.status(httpStatus.NOT_ALLOW).json({ message: 'Invalid old password provided!' })
            }
        })
    }
}

// User Pre-Reset Password
userService.preResetPwd = function(req, res) {
    if(!req.body.email || !validator.validate(req.body.email) || !req.body.software) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide an valid email and the name of the software.'})
    } else {
        UserModel.findOne({
            where: {email: req.body.email}
        }).then(function(user) {
            if(!user) {
                res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
            } else {
                // update is_reset field
                user.update({
                    is_reset: true
                }).then(function(){
                    const user_data = {
                        username: user.username,
                        email: user.email
                    }
                    // generate ResetToken
                    var token = jwt.sign(user_data, config.keys.secret, {
                        expiresIn: 60 * 10 // expires in 10 minute
                    })
                    logger.debug(token)
                    
                    // Email the ending characters of ResetToken
                    var end_token = token.substr(token.length-6, token.length)
                    transporter.sendVerificationCode(req.body.email, user.username, req.body.software, end_token)
                    
                    // Return the rest of ResetToken
                    var pre_token = token.substr(0, token.length-6)
                    res.status(httpStatus.OKAY).json({
                        pre_token: pre_token 
                    })
                })
            }
        }).catch(function(error) {
            errLogger.error('User Rre-reset Password Error:\n' + error)
            res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
        })
    }
}

// User Reset Password
userService.resetPwd = function(req, res) {
    if(!req.headers.resettoken){
		res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'No password reset token provided!' })
	} 
    else if(!req.body.new_password) {
        res.status(httpStatus.NOT_ACCEPTABLE).json({ message: 'Please provide a new password.'})
    } 
    else {
        jwt.verify(req.headers.resettoken, config.keys.secret, function(err, decoded) {      
			if (err) {
				res.status(httpStatus.NOT_ALLOW).json({ message: 'Reset Token Expired!' })
			} else {
                logger.debug(decoded)
                UserModel.findOne({
                    where: {username: decoded.username, email: decoded.email}
                }).then(function(user) {
                    if(!user) {
                        res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
                    } else {
                        // check is_reset field
                        if(user.is_reset){
                            // update password
                            logger.debug(user)
                            user.update({
                                is_reset: false,
                                password: req.body.new_password
                            }).then(function(){
                                res.status(httpStatus.OKAY).json({message: 'User Password Updated'})
                            })
                        } else {
                            res.status(httpStatus.NOT_ALLOW).json({ message: 'Reset Token Invalid!' })
                        }
                    }
                }).catch(function(error) {
                    errLogger.error('User Reset Password Error:\n' + error)
                    res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
                })
            }
        })
    }
}

// Delete user info
userService.del = function(req, res) {
    // obtain the specific user
    UserModel.findOne({
        where: { id: req.user.id }
    }).then(function(user) {
        if(!user) {
            res.status(httpStatus.NOT_FOUND).json({ message: 'User not Found!' })
        } else {
            // delete user data
            user.destroy().then(function(){
                res.status(httpStatus.OKAY).json({message: 'User Info Deleted!'})
            })
        }
    }).catch(function(error) {
        logger.error('User Delete Error:\n' + error)
        res.status(httpStatus.SERVER_ERROR).json({ message: 'Server Internal Error!' })
    })
}

module.exports = userService;
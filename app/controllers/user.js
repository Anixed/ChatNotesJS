var User   = require('../models/user'),
	moment = require('moment'),
	_ 	   = require('underscore'),
	S 	   = require('string'),
	url    = require('url');

// change the global language dates to Spanish
moment.lang('es');

// Functions
var funcs = require('../../config/functions');

var userController = function(server) {

	server.get('/user/profile', funcs.isntLoggedIn, function(req, res, next) {
		var query = url.parse(req.url, true).query;

		if (req.user.chatStatus != 'disable') {
			funcs.changeUserStatus(req, 'disable');
		}

		var options = {
			query: { '_id' : req.session.passport.user._id },
			select: 'username displayname email avatar'
		};
		User.select(options, function(err, user) {
			if (err) return next(err);

			if (user) {
				user.email = ( _.isNull(user.email) ) ? '' : user.email ;
				res.render('user-profile', {
					action: 'edit-my-profile',
					userSession: req.user,
					userSearch: user,
					msg: funcs.appMessages(query.msg),
					error: funcs.appErrors(query.error)
				});
			} else {
				next(funcs.appErrors('user-not-found')); //res.redirect('/logout?error=user-not-found');
			}
		});

	});

	server.post('/user/profile/update', funcs.isntLoggedIn, function(req, res) {

		var formisEmpty = false;
		for (item in req.body) {
			if ( _.isEmpty(req.body[item]) ) {
				formisEmpty = true;
				break;
			}
		}

		if (!formisEmpty) {

			var fields = {
				username: S(req.body.username).trim().s,
				displayname: S(req.body.displayname).trim().s,
				email: S(req.body.email).trim().s,
				avatar: S(req.body.avatar).trim().s
			};
			User.updateProfile(req.session.passport.user._id, fields, function(err, user) {
				if (err) return res.redirect('/user/profile?error=could-not-update');
				if (user) {
					funcs.updateUserInSession(req, user);
					res.redirect('/chat');
				}
			});

		} else {
			res.redirect('/user/profile?error=form-is-empty');
		}

	});

	server.get('/user/:username', funcs.isntLoggedIn, function(req, res, next) {

		if (req.user.chatStatus != 'disable') {
			funcs.changeUserStatus(req, 'disable');
		}

		var options = {
			query: { 'username' : req.params.username },
			select: 'username displayname joined last_logon last_logout avatar'
		};
		User.select(options, function(err, user) {
			if (err) return next(err);	

			if (user) {
				user = user.toJSON();
				user.joined = moment(user.joined).format("dddd D, [a las] h:mm a");
				user.last_logon = moment(user.last_logon).format("dddd D, [a las] h:mm a");
				user.last_logout = moment(user.last_logout).format("dddd D, [a las] h:mm a");
				
				res.render('user-profile', {
					action: 'view-user-profile',
					userSession: req.user,
					userSearch: user,
					error: null
				});
			} else {
				next(funcs.appErrors('user-not-found'));
			}
		});

	});

};

module.exports = userController;
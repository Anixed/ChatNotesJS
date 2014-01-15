var User = require('../models/user'),
	url  = require('url');

// Functions
var funcs = require('../../config/functions');

var homeController = function(server) {

	server.get('/', function(req, res) {
		res.redirect('/login');
	});

	server.get('/login', funcs.isLoggedIn, function(req, res) {
		var query = url.parse(req.url, true).query;

		res.render('login', {
			error: funcs.appErrors(query.error)
		});
	});

	server.get('/logout', funcs.isntLoggedIn, function(req, res) {
		var query = url.parse(req.url, true).query;
		var error = (query.error) ? '?error='+query.error : '' ;

		var options = {
			query: {
				'_id' : req.session.passport.user._id,
				'active_session' : true
			}
		};
		User.logout(options, function(err, logout) {
			if (err) return res.redirect('/chat?error=in-logout');
			if (logout) {
				var user = req.user;
				req.logout(); //req.session.destroy();
				req.io.broadcast('logout-user', user);
			}

			res.redirect('/login'+error);
		});

	});
};

module.exports = homeController;
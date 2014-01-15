var passport 		= require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;
	User 			= require('../models/user');

// Functions
var funcs = require('../../config/functions');

var facebookConnection = function(server) {

	// Authentication Strategy
	passport.use(new FacebookStrategy({
		clientID: '1425490724334311',
		clientSecret: '8d65fe711e23720796383e40bd76d56f',
		callbackURL: '/login/facebook/callback', //'http://127.0.0.1:3000/login/facebook/callback'
		profileFields: ['id', 'displayName', 'name', 'username', 'photos', 'profileUrl', 'gender', 'locale', 'timezone']
		//Alternatively, you can specify the profileURL (including fields) directly:
		//profileURL: 'https://graph.facebook.com/me?fields=id,username,name,picture'
	},
	function(accessToken, refreshToken, profile, done) {

	// asynchronous verification, for effect...
	process.nextTick(function() {

		var query = User.findOne({ 'profile_facebook.id' : profile.id });
		query.select('username displayname last_logon active_session open_sessions');
		query.exec(function(err, foundUser) {
			var now = new Date();

			if (foundUser) {

				if (foundUser.active_session == false) {
				foundUser.last_logon = now;
				foundUser.active_session = true;
				}
				foundUser.open_sessions += 1;
				foundUser.save(function(err) {
					if (err) { return done(err); }
				});

				//console.log('User [' + foundUser.username + '] found and logged in!...');
				var loggedUser = foundUser.toJSON();

				done(null, loggedUser);

			} else {

				var newUser = new User({
					username: profile.username,
					displayname: profile.displayName,
					email: null,
					joined: now,
					last_logon: now,
					last_logout: null,
					active_session: true,
					open_sessions: 1,
					avatar: profile._json.picture.data.url || profile.photos[0].value,
					profile_twitter: null,
					profile_facebook: profile
				});

				newUser.save(function(err, newUser) {
					if (err) { return done(err); }

					//console.log('New user [' + newUser.username + '] created and logged in!...');
					var loggedUser = funcs.delete_social_profile(newUser.toJSON());

					done(null, loggedUser);
				});

			}

		});

	});

	}));

	// Redirect the user to Facebook for authentication.  When complete,
	// Facebook will redirect the user back to the application at /login/facebook/callback
	server.get('/login/facebook', passport.authenticate('facebook'));

	// Facebook will redirect the user to this URL after approval.  Finish the
	// authentication process by attempting to obtain an access token.  If
	// access was granted, the user will be logged in.  Otherwise,
	// authentication has failed.
	server.get('/login/facebook/callback', passport.authenticate('facebook', {
		//successRedirect: '/chat',
		failureRedirect: '/login?error=login-error'
	}),
	function(req, res) {
		// Si es la primera sesión que abre entonces se le comunica al chat
		if (req.user.open_sessions == 1) {
			req.io.broadcast('login-user', req.user);
		}

		// The user has authenticated with Facebook. Now check to see if the profile
		// is "complete". If not, send them down a flow to fill out more details.
		/*if (funcs.isCompleteProfile(req.user._id)) {
			res.redirect('/chat');
		} else {
			res.redirect('/user/profile?msg=complete-profile');
		}*/
		res.redirect('/chat');
	});
};

module.exports = facebookConnection;
var passport 		= require('passport'),
	TwitterStrategy = require('passport-twitter').Strategy;
	User 			= require('../models/user');

// Functions
var funcs = require('../../config/functions');

var twitterConnection = function(server) {

	// Authentication Strategy
	passport.use(new TwitterStrategy({
		consumerKey: '1yh3MFOAbr8ZZG5Mmmwxhg',
		consumerSecret: 'Sdn7l4exdiQ5z2v7MnSBWta9BgGShY79n5hvGpADhn8',
		callbackURL: '/login/twitter/callback' //'http://127.0.0.1:3000/login/twitter/callback'
	},
	function(token, tokenSecret, profile, done) {

	// asynchronous verification, for effect...
	process.nextTick(function() {

		var query = User.findOne({ 'profile_twitter.id' : profile.id });
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
					avatar: profile._json.profile_image_url || profile.photos[0].value,
					profile_twitter: profile,
					profile_facebook: null
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

	// Redirect the user to Twitter for authentication.  When complete, Twitter
	// will redirect the user back to the application at /login/twitter/callback
	server.get('/login/twitter', passport.authenticate('twitter'));

	// Twitter will redirect the user to this URL after approval.  Finish the
	// authentication process by attempting to obtain an access token.  If
	// access was granted, the user will be logged in.  Otherwise,
	// authentication has failed.
	server.get('/login/twitter/callback', passport.authenticate('twitter', {
		//successRedirect: '/chat',
		failureRedirect: '/login?error=login-error'
	}),
	function(req, res) {
		// Si es la primera sesión que abre entonces se le comunica al chat
		if (req.user.open_sessions == 1) {
			req.io.broadcast('login-user', req.user);
		}

		// The user has authenticated with Twitter. Now check to see if the profile
		// is "complete". If not, send them down a flow to fill out more details.
		/*if (funcs.isCompleteProfile(req.user._id)) {
			res.redirect('/chat');
		} else {
			res.redirect('/user/profile?msg=complete-profile');
		}*/
		res.redirect('/chat');
	});
};

module.exports = twitterConnection;
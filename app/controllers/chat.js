var User 	= require('../models/user'),
	Post 	= require('../models/post'),
	moment 	= require('moment'),
	_ 		= require('underscore'),
	S 		= require('string'),
	url 	= require('url');

// change the global language dates to Spanish
moment.lang('es');

// Functions
var funcs = require('../../config/functions');

var chatController = function(server) {

	server.get('/chat', funcs.isntLoggedIn, function(req, res, next) {
		var query = url.parse(req.url, true).query;

		Post.list({}, function(err_posts, posts) {
		if (err_posts) return next(err_posts);

		var options = {
			query: { 'active_session' : true/*, '_id': { $ne: req.session.passport.user._id }*/ },
			select: 'username displayname last_logon last_logout avatar'
		};
		User.list(options, function(err_users, users) {
			if (err_users) return next(err_users);

			var postsToJson = _.map(posts, function(post) {
				post = post.toJSON();
				post.date_post = {
					default: post.date_post,
					timeago: moment(post.date_post).fromNow()
				};
				return post;
			});

			var usersToJson = _.map(users, function(user) {
				user = user.toJSON();
				user.last_logon = {
					default: user.last_logon,
					formatted_date: moment(user.last_logon).format("dddd D, [a las] h:mm a")
				};
				return user;
			});

			if (req.user.chatStatus == 'disable') {
				funcs.changeUserStatus(req, 'enable');
			}

			res.render('chat', {
				userSession: req.user,
				users: usersToJson,
				posts: postsToJson, //!_.isEmpty(postsToJson) ? postsToJson : null,
				error: funcs.appErrors(query.error)
			});

		});
		});

	});

	server.post('/chat/create-post', funcs.isntLoggedIn, funcs.getUser, function(req, res) {
		var content = S(req.body.content).trim().s;
		var now = new Date();

		if ( _.isEmpty(content) ) return res.redirect('/chat?error=post-is-empty');

		Post.insertNew({
			content: content,
			date_post: now,
			user: req.user
		}, function(err, post) {
			if (err) {
				req.io.emit('new-post', { error: err });
			} else {
				server.io.broadcast('new-post', {
					error: null,
					content: post.content,
					date_post: post.date_post,
					/*date_post: {
						default: post.date_post,
						timeago: moment(post.date_post).fromNow()
					},
					user: req.user*/
					user: {
						username: req.user.username,
						displayname: req.user.displayname,
						avatar: req.user.avatar
					}
				});
			}

			res.redirect('/chat'); //res.send(200, 'Post sent successfully!');
		});

	});

};

module.exports = chatController;
var User = require('../app/models/user'),
	Post = require('../app/models/post'),
	_ 	 = require('underscore');

// Functions
var funcs = require('./functions');

module.exports = function(server) {

/**
* Socket.io routes
*/

// variable setTimeout para controlar el logout del usuario cuando cierra el navegador
var timer_logout_user;


/*server.io.on('connection', function(socket) {
	socket.on('hello-server?', function(req) {
		clearTimeout(timer_logout_user);
		socket.emit('server-is-ready', { success: 'Server is Ready!!!' });
	});
});*/
server.io.route('hello-server?', function(req) {
	clearTimeout(timer_logout_user);

	req.io.respond({
		success: 'Server is Ready!!!'
	});
});

server.io.route('update-posts', function(req) {
	if (!req.session.passport.user) {
		req.io.respond(null);
	} else {
		Post.list({}, function(err, posts) {
			if (posts) {
				var postsToJson = _.map(posts, function(post) {
					post = post.toJSON();
					post.date_post = {
						default: post.date_post,
						timeago: moment(post.date_post).fromNow()
					};
					return post;
				});

				req.io.respond(postsToJson);
			}
		});
	}
});

// Se ejecuta al cerrar la ventana del navegador,
// desactivando momentáneamente al usuario en el chat
server.io.route('page-closing', function(req) {

	var options = {
		query: {
			'_id' : req.session.passport.user._id,
			'open_sessions' : 1,
			'active_session' : true
		}
	};
	User.select(options, function(err, user) {
		if (err) return;
		if (user) {
			timer_logout_user = setTimeout(function() {
				funcs.changeUserStatus(req, 'disable');
			}, 1000*60*1);
		}
	});

});

};
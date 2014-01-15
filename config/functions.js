var _ 		= require('underscore'),
	moment 	= require('moment');


/*
* Functions
*/

// Elimino los perfiles sociales antes de guardar el usuario en sesión, así no sobrecargar la sesión
exports.delete_social_profile = function(user) {
	delete user.profile_twitter;
	delete user.profile_facebook;
	return user;
};

exports.isCompleteProfile = function(userID) {
	
	var options = {
		query: { '_id' : userID },
		select: 'username displayname email avatar joined'
	};
	User.select(options, function(err, user) {
		var now = moment();
		var joined = moment(user.joined);

		if ( now.diff(joined, 'days') < 1 && _.isNull(user.email) )
			return false;
		else
			return true;
	});

}

// Cambio el estado del usuario en el chat a habilitado/deshabilitado
exports.changeUserStatus = function(req, action) {
	req.session.passport.user.chatStatus = action;
	req.io.broadcast('change-user-status', {
		user: req.user,
		action: action
	});
};

exports.updateUserInSession = function(req, user) {
	req.session.passport.user = exports.delete_social_profile(user.toJSON());
};

exports.appMessages = function(msg) {

	var messages = {
		'complete-profile'		: 'Si lo deseas puedes completar tu perfil,<br />sino haz clic en "Volver al Chat".'
	};

	return messages[msg];
};

exports.appErrors = function(error) {

	var errors = {
		'post-is-empty'		: 'El mensaje enviado está vacío.',
		'form-is-empty'		: 'Todos los campos son requeridos.',
		'user-not-found'	: 'Usuario no encontrado.',
		'expired-session'	: 'La sesión ha expirado.',
		'logged-off'		: 'Sesión finalizada.',
		'login-error'		: 'Error al iniciar sesión.',
		'in-logout'			: 'Error al cerrar la sesión del usuario.',
		'could-not-update'	: 'Error al actualizar.'
	};

	return errors[error];
};


/*
* Middlewares
*/

// obtengo el modelo del usuario en sesión
exports.getUser = function(req, res, next) {
	User.findById(req.session.passport.user._id, function(err, user) {
		if (err) return next(err);
		if (!user) return next(new Error('No se ha encontrado al usuario.'));
		req.user = user;
		next();
	});
};

exports.isLoggedIn = function(req, res, next) {
	if (req.session.passport.user) {
		res.redirect('/chat');
		return;
	}
	next();
};

exports.isntLoggedIn = function(req, res, next) {
	if (!req.session.passport.user) {
		res.redirect('/login?error=expired-session');
		return;
	} else {
		User.findOne({ '_id' : req.session.passport.user._id, 'active_session' : true }, function(err, user) {
			if (err || !user) {
				req.session.destroy();
				res.redirect('/login?error=logged-off');
				return;
			}
		});
	}
	next();
};
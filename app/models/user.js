var models = require('./models'),
	Schema = models.Schema;

var userSchema = new Schema({
	username			: { type: String, required: true, unique: true },
	displayname			: String,
	email				: String, //{ type: String, unique: true },
	joined				: { type: Date, default: Date.now },
	last_logon			: { type: Date, default: Date.now },
	last_logout			: { type: Date, default: Date.now },
	active_session		: { type: Boolean, default: false },
	open_sessions		: { type: Number, default: 0 },
	avatar				: String,
	profile_twitter		: { type: Schema.Types.Mixed, default: null },
	profile_facebook	: { type: Schema.Types.Mixed, default: null }
});

userSchema.statics = {

	list: function(options, callback) {
		var query = options.query || {};
		var select = options.select || {};

		this.find(query)
		.sort('+last_logon')
		.select(select)
		.exec(callback);
	},

	select: function(options, callback) {
		var query = options.query || {};
		var select = options.select || {};

		this.findOne(query)
		.select(select)
		.exec(callback);
	},

	/*updateProfile: function(id, fieldsToUpdate, callback) {
		this.update({ '_id' : id }, {
			$set: fieldsToUpdate
		},
		function(err, numberAffected) {
			callback(err, numberAffected);
		});
	},*/
	updateProfile: function(id, fieldsToUpdate, callback) {
		this.findById(id, function(err, user) {
			user.username = fieldsToUpdate.username;
			user.displayname = fieldsToUpdate.displayname;
			user.email = fieldsToUpdate.email;
			user.avatar = fieldsToUpdate.avatar;
			user.save(callback);
		});
	},

	logout: function(options, callback) {
		var query = options.query || {};

		this.findOne(query, function(err, user) {
			if (user) {
				user.last_logout = new Date();
				user.active_session = false;
				user.open_sessions = 0;
				user.save(function(err) {
					callback(err, true);
				});
			} else {
				callback(err, false);
			}
		});
	}

};

var User = models.model('user', userSchema);

module.exports = User;
var models = require('./models'),
	Schema = models.Schema;

var postSchema = new Schema({
	content : String,
	date_post : { type: Date, default: Date.now },
	user : {
		type: Schema.Types.ObjectId,
		ref: 'user'
	}
});

postSchema.statics = {

	list: function(options, callback) {
		var query = options.query || {};

		this.find(query)
		.populate('user', 'username displayname avatar')
		.sort('+date_post') //.sort({'date_post': 1})
		.exec(function(err, posts) {
			if (err) {
				callback(err, null);
			} else {
				callback(null, posts);
			}
		});
	},

	insertNew: function(newPost, callback) {
		var post = new this(newPost);
		post.save(callback);
	}

};

var Post = models.model('post', postSchema);

module.exports = Post;
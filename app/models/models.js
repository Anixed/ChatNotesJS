// Mongoose Connection
var mongoose = require('mongoose');

var db = mongoose.connection;
var dbURI = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/' + 'ChatNotesJS';

db.on('disconnected', function() {
	mongoose.connect(dbURI, { server : {auto_reconnect : true} });
});

db.on('error', function(error) {
	console.error('Error in MongoDb Connection: ' + error);
	mongoose.disconnect();
});

mongoose.connect(dbURI, { server : {auto_reconnect : true} });

module.exports = mongoose;
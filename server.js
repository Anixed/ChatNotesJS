// Libraries
// ---------
var express		= require('express.io'),
	RedisStore	= require('connect-redis')(express),
	swig		= require('swig'),
	passport	= require('passport'),
	url 		= require('url');

// Configs
// -------
var server = express();
server.http().io();


// Dotenv loads environment variables from .env into ENV (process.env)
// Add your application configuration to your .env file in the root of your project
var dotenv = require('dotenv');
dotenv.load();

// Force environment
//process.env.NODE_ENV = 'production';
// Force use MongoHQ (MongoDB Hosting)
//process.env.MONGOHQ_URL = "mongodb://<user>:<password>@alex.mongohq.com:<port>/<database>"; //"mongodb://user:pass@server.mongohq.com:port_name/db_name";
// Force use Redis To Go (Simple Redis Hosting)
//process.env.REDISTOGO_URL = "redis://redistogo:<password>@grideye.redistogo.com:<port>/"; //"redis://username:password@host:port";


// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
server.set('view cache', true);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

//var MemStore = express.session.MemoryStore;

// Heroku redistogo connection
if (process.env.REDISTOGO_URL) {
	var redisUrl = url.parse(process.env.REDISTOGO_URL);
	var redisAuth = redisUrl.auth.split(":"); // auth 1st part is username and 2nd is password separated by ":"

	var SessionStore = new RedisStore({
		//client: redis,
		host: redisUrl.hostname,
		port: redisUrl.port,
		//user: conf.redis.user,
		db: redisAuth[0],
		pass: redisAuth[1]
	})

// Localhost
} else {
	var SessionStore = new RedisStore({
		//client: redis,
		host: '127.0.0.1',
		port: 6379,
		//user: conf.redis.user,
		//db: 'mydb',
		//pass: 'RedisPASS'
	})
}


// Add post, cookie and session support.
// Configure the application for all environments.
server.configure(function() {

	this.set('env', process.env.NODE_ENV || 'development'); //var env = process.argv[2] || process.env.NODE_ENV || 'development';

	// View engine
	server.engine('html', swig.renderFile);
	server.set('view engine', 'html');
	server.set('views', __dirname + '/app/views');

	server.use( express.static(__dirname + '/public') );
	//server.use( express.favicon(__dirname + '/public/images/favicon.ico') );

	server.use( express.logger() );
	server.use( express.cookieParser() );
	server.use( express.bodyParser() );

	// Use connect-redis as session middleware
	server.use( express.session({
		secret : process.env.CLIENT_SECRET || '4t89g827bcjs300hsboj',
		store  : SessionStore, //store  : MemStore({ reapInterval: 60000 * 10 })
		cookie : { maxAge: 60000 * 60 * 2 } // 2h Session lifetime
	}) );

	server.use( passport.initialize() );
	server.use( passport.session() );

	//server.use( server.router );

});

// serialize sessions
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
/*passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});*/

// Environments
// ------------
// development only
server.configure('development', function() {
	server.use(express.logger());
	// this is the error handler, uncomment #1 to see it in action
	server.use(express.errorHandler({
		dumpExceptions: true,
		showStack : true
	}));
});

// production only
server.configure('production', function() {
	// this is the error handler for the production env
	server.use(express.errorHandler({
		dumpExceptions: false,
		showStack: false
	}));
});

// Controllers
// -----------
require('./app/controllers/home')(server);
require('./app/controllers/chat')(server);
require('./app/controllers/user')(server);

// Connections
// -----------
require('./app/connections/twitter')(server);
require('./app/connections/facebook')(server);

// Load other routes
// -----------------
require('./config/routes')(server);

// Error pages
// -----------
server.use(function(err, req, res, next) {
	// if an error occurs Connect will pass it down
	// through these "error-handling" middleware
	// allowing you to respond however you like
	res.status(500).render('page-error', {
		status: err.status || 500,
		title: '¡Ups!... D:',
		error: {
			err: 'Error en el servidor',
			details: '<span>&raquo; <strong>error:</strong> ('+err+')</span><br /><a href="/chat">#Volver al chat</a>'
		}
	});
});

// Devuelve un error 404 si ningún middleware responde
server.use(function(req, res, next) {
	res.status(404).render('page-error', {
		status: 404,
		//url: req.originalUrl,
		title: 'Error 404!',
		error: {
			err: 'No se ha encontrado la página solicitada',
			details: '<a href="/chat">#Volver al chat</a>'
		}
	});
});

// Listen on http port
// -------------------
var port = process.env.PORT || 5000;
server.listen(port, function() { //server.listen(port, '127.0.0.1', function() {
	//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	console.log('Servidor Express corriendo en el puerto "%d", en entorno "%s"', port, server.locals.settings.env);
});
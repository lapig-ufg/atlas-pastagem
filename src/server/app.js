var express = require('express')
, cluster = require('cluster')
, load = require('express-load')
, path = require('path')
, util    = require('util')
, compression = require('compression')
, requestTimeout = require('express-timeout')
, responseTime = require('response-time')
, timeout = require('connect-timeout')
, bodyParser = require('body-parser')
, multer = require('multer')
, session = require('express-session')
, parseCookie = require('cookie-parser');

var app = express();
var http = require('http').Server(app);
var MongoStore = require('connect-mongo')(session);
var cookie = parseCookie('LAPIG')

load('config.js', {'verbose': false})
.then('libs')
.then('middleware')
.into(app);

app.middleware.repository.init(function() {
	
	var mongodbUrl = 'mongodb://' + app.config.mongo.host + ':' + app.config.mongo.port + '/' + app.config.mongo.dbname;

	app.repository = app.middleware.repository;
	var store = new MongoStore({ url: mongodbUrl });

	app.use(cookie);
	var middlewareSession = session({ 
		store: store,
		secret: 'LAPIG',
		resave: false,
    saveUninitialized: true,
		key: 'sid',
		cookie: {
			maxAge: 1000 * 60 * 60 * 24
		}
	})

	app.use(middlewareSession);
	
	app.use(compression());
	app.use(express.static(app.config.clientDir));
	app.set('views', __dirname + '/templates');
	app.set('view engine', 'ejs');

	var publicDir = path.join(__dirname, '');

	app.use(requestTimeout({
		'timeout': 1000 * 60 * 30,
		'callback': function(err, options) {
			var response = options.res;
			if (err) {
				util.log('Timeout: ' + err);
			}
			response.end();
		}
	}));

	app.use(responseTime());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(multer());

	app.use(function(error, request, response, next) {
		console.log('ServerError: ', error.stack);
		next();
	});

	load('models', {'verbose': false})
	.then('controllers')
	.then('routes')
	.into(app);

	http.listen(app.config.port, function() {
		console.log('D-PAT Server @ [port %s] [pid %s]', app.config.port, process.pid.toString());
		if(process.env.PRIMARY_WORKER) {
			
		}
	});

});

process.on('uncaughtException', function (err) {
	console.error(err.stack);
});

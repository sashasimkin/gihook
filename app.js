#!/usr/bin/env node
/**
 * Dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var exec = require('child_process').exec;
var Logger = require('./lib/Logger');
var TaskManager = require('./lib/TaskManager');
String.prototype.fmt = require('./lib/format');

// Process cli arguments
var opts = require("./lib/options");

// Setup express-related settings and middlewares
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('consolidate').hogan);
app.set('view engine', 'html');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var cookieParser = require('cookie-parser');
app.use(cookieParser('uFS&*04DH437SFDG^DFG4dfhr87su*&'));

var session = require('express-session');
app.use(session({
    name: 'abrakadabra',
    secret: 'moarMeow'
}));

var csrf = require('csurf');
app.use(csrf());


// app.use(express.favicon(__dirname + '/public/favicon.ico'));

// Routes in application
var main = require('./routes/main');


// Set logs directory
if(opts.logs) {
    Logger.directory = opts.logs;
}

if (opts.debug) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());

  app.locals.pretty = true; // Jade pretty html output
}

app.use('/static', express.static(__dirname + '/public'));


// Load configs to persistent for process object
var configs = require("./lib/loadConfigs")(opts.config);

require('./lib/runner')(configs);

// app.get('/', main.dashboard(configs));

var api = require('./routes/api');
app.use(api);

app.route('/manage').get(main.dashboard);

// Main route that responsible for each request
// Just push element into queue
app.route('/:config').post(main.main);

// Fallback for all unmapped requests
app.route('*').all(main.fallback);


process.on('uncaughtException', function(err) {
    if(err.errno === 'EADDRINUSE') {
        console.log('Can\'t start server. Address {a} already in use.'.fmt({a: opts.address}));
    } else {
        console.log(err);
        console.log('Please leave traceback on https://github.com/sashasimkin/gihook/issues if you can.');
    }
    process.exit(1);
});

http.createServer(app).listen(process.env.PORT, process.env.IP, function() {
    console.log('GiHook just running on ' + process.env.IP + ':' + process.env.PORT + ' Enjoy!');
});
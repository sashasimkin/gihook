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

// Setup express-related settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('uFS&*04DH437SFDG^DFG4dfhr87su*&'));
app.use(express.session());
app.use(express.csrf());

app.use(express.favicon(__dirname + '/public/favicon.ico'));

// Routes in application
var main = require('./routes/main');
var api = require('./routes/api');

// Set logs directory
if(opts.logs) {
    Logger.directory = opts.logs;
}

if (opts.debug) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());

  app.locals.pretty = true; // Jade pretty html output
}

app.use(express.static(__dirname + '/public'));
app.use(app.router);

// Load configs to persistent for process object
var configs = require("./lib/loadConfigs")(opts.config);

require('./lib/runner')(configs);

app.get('/', main.dashboard(configs));

app.get('/api/:config', api.getCfg);
app.put('/api/:config', api.save);

// Main route that responsible for each request
app.post('/:config', main.main);
// Fallback for all unmapped requests
app.all('*', main.fallback);

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
    console.log('GiHook got running on ' + process.env.IP + ':' + process.env.PORT + ' Enjoy!');
});
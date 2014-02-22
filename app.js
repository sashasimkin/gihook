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

// Setup express-related settings
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// Configure arguments
var opts = require("nomnom")
    .option('config', {
        list: true,
        abbr: 'c',
        default: ['config'],
        help: 'Directories which contains JSON files or paths to JSON-files'
    }).option('address', {
        position: 0,
        help: 'Specify address bind to. E.g. 127.0.0.1:3005 or 0.0.0.0 or only port 3005 address by default 0.0.0.0',
        default: '0.0.0.0:3000'
    }).option('logs', {
        abbr: 'l',
        help: 'Set directory for logs, if not set - fallback to logging in console',
        default: false
    }).option('debug', {
        abbr: 'd',
        help: 'Enable logging to console',
        flag: true,
        default: false
    }).parse();

// Set logs directory
if(opts.logs) {
    Logger.directory = opts.logs;
}

//IP and PORT for web-server
(function() {
    // FixMe: I don't like this, but what to do
    var address = opts.address ? String(opts.address).split(':') : [];

    if(address.length == 1) {
        if(!isNaN(parseFloat(address[0])) && isFinite(address[0])) {
            address = ['0.0.0.0', parseInt(address[0])];
        } else {
            address = [address[0], 3000];
        }
    }
    process.env.IP = process.env.IP || address[0];
    process.env.PORT = process.env.PORT || address[1];
})();


// development only
if (opts.debug) {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
}

// Load configs to persistent for process object
var configs = require("./lib/loadConfigs")(opts.config);

var runTask = function(task) {
    var logger = new Logger(task.name);

    task.running();
    var command = task.commands.shift();
    if (!command) {
        return task.finished();
    }
    exec(command, task.options, function(err, stdout, stderr) {
        if (stdout) logger.info('[out]["' + command + '"]: ' + stdout);
        if (stderr) logger.error('[Error]["' + command + '"]: ' + stderr);
        runTask(task);
    });
};

//Setup task manager
var queue = new TaskManager();
queue.run(function() {
    runTask(this);
}, 1000);

// Main route that responsible for each request
app.post('/:config', function(req, res) {
    //Strip request.url, remove first slash
    var config_name = req.params.config;
    var config = configs[config_name];
    var logger = new Logger(config_name);

    if (!config || req.body.zen) {
        logger.error('Invalid request for config: ' + config_name);
        // Log invalid request
        return;
    }

    var payload = req.body;
    //We need object copy!
    var task = JSON.parse(JSON.stringify(config));
    task.name = config_name;
    task.options = {
        encoding: "utf-8",
        env: process.env,
        cwd: task.path
    };
    if (task.refs) {
        var refsType = typeof task.refs;
        if (['string', 'object'].indexOf(refsType)) {
            if (refsType == 'string') task.refs = [task.refs];
            var suitableRef = Object.keys(task.refs).some(function(k) {
                return payload.ref.match(task.refs[k]);
            });
            if (!suitableRef) return logger.info('Ref does not fit. Aborting.');
        }
    }

    // Pre-process commands related to request
    if (task.commands.length) {
        //Access to payload and task from command definition
        task.commands.filter(function(command, i) {
            if (command.fmt) {
                task.commands[i] = command.fmt({
                    payload: payload,
                    task: task
                });
                return true;
            } else {
                return logger.info('Unexpected command "{c}". Command must be a string.'.fmt({c: command}));
            }
        });

        // And deal with it for this time. Now let the queue sort it
        queue.push(config_name, task);

        logger.info('Got valid request on: ' + config_name);
    } else {
        return logger.info('No commands to execute.');
    }

    res.send(".");
});

app.all('*', function(req, res) {
    res.send("There is nothing. Go ahead!");
});

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
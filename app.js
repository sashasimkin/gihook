/**
 * Dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var exec = require('child_process').exec;
var logger = require('./lib/logger');
var TaskManager = require('./lib/TaskManager');
String.prototype.fmt = require('./lib/format');

// Sutup middlewares
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

//IP and PORT for web-server
var run_argv = process.argv[2] ? process.argv[2].split(':') : [];
process.env.IP = process.env.IP || run_argv[0] || '0.0.0.0';
process.env.PORT = process.env.PORT || run_argv[1] || 3000;

// development only
if ('development' == app.get('env')) {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
}

//Runtime variables
var cfg = {
    dir: __dirname + '/config/',
    map: {}
};
//Load configs
require("./lib/loadConfigs")(cfg.dir, cfg.map);

var runTask = function(task) {
    task.running();
    var command = task.commands.shift();
    if (!command) {
        return task.finished();
    }
    exec(command, task.options, function(err, stdout, stderr) {
        if (stdout) logger(task.name + '.info').log('[out]["' + command + '"]: ' + stdout);
        if (stderr) logger(task.name + '.error').log('[Error]["' + command + '"]: ' + stderr);
        runTask(task);
    });
};

//Setup task manager
var queue = new TaskManager();
queue.run(function() {
    runTask(this);
}, 1000);

app.post('/:config', function(req, res) {
    //Strip request.url, remove first slash
    var config_name = req.params.config;
    var config = cfg.map[config_name];

console.log(req.body);

    if (!config || req.body.zen) {
        logger(config_name + '.error').log('Invalid request for config: ' + config_name);
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
            if (!suitableRef) return logger(config_name + '.info').log('Ref does not fit. Aborting.');
        }
    }
    // Preprocess commands related to request
    if (task.commands.length) {
        //Access to payload and task from command definition
        task.commands.filter(function(el, i) {
            if (el.fmt) {
                task.commands[i] = el.fmt({
                    payload: payload,
                    task: task
                });
                return true;
            } else {
                logger(config_name + '.info').log('Command must be string.' + e.stack);
                return false;
            }
        });
        queue.push(config_name, task);
    } else {
        return logger(config_name + '.info').log('No commands to execute.');
    }

    res.send(".");
});

app.all('*', function(req, res) {
    res.send("There is nothing. Go ahead!");
});


http.createServer(app).listen(process.env.PORT, process.env.IP, function() {
    console.log('GiHook got running on ' + process.env.IP + ':' + process.env.PORT + ' Enjoy!');
});
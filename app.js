var http = require('http');
var exec = require('child_process').exec;
var logger = require('./lib/logger');
var TaskManager = require('./lib/TaskManager');
String.prototype.fmt = require('./lib/format');

//IP and PORT for web-server
var run_argv = process.argv[2] ? process.argv[2].split(':') : [];
process.env.IP = process.env.IP || run_argv[0] || '0.0.0.0';
process.env.PORT = process.env.PORT || run_argv[1] || 8001;

//Runtime variables
var cfg = {
    dir: __dirname + '/config/',
    map: {}
};

//Observe configs
require("./lib/observeConfigs")(cfg.dir, cfg.map);

var runTask = function (task) {
    task.running();
    var command = task.commands.shift();
    if (!command) {
        return task.finished();
    }
    
    exec(command, task.options, function(err, stdout, stderr) {
        if (stdout) logger(task.name + '.info').log('Data from "' + command + '": ' + stdout);
        if (stderr) logger(task.name + '.error').log('Error in "' + command + '": ' + stderr);
        
        runTask(task);
    });
};

//Setup task manager
var queue = new TaskManager();
queue.run(function () {
    runTask(this);
}, 1000);

//Create Server
http.createServer(function (request, response) {
    logger('access').log('Request on: ' + request.url);
    //Strip request.url, remove first slash
    request.url = request.url.slice(1);
    //Prevent favicon.ico requests
    if (request.methom == 'GET' && request.url == 'favicon.ico') return request.connection.destroy();

    if (request.method == 'POST' && cfg.map[request.url]) {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            try {
                var payload = JSON.parse(body);
            } catch (e) {
                return logger(request.url + '.error').log('Malformed json. Request body: ' + body);
            }
            //We need object copy!
            var task = JSON.parse(JSON.stringify(cfg.map[request.url]));
            task.name = request.url;
            task.options = {
                encoding: "utf-8",
                env: process.env,
                cwd: task.path
            };

            if (task.refs) {
                var refsType = typeof task.refs;
                if (['string', 'object'].indexOf(refsType)) {
                    if (refsType == 'string') task.refs = [task.refs];

                    var suitableRef = Object.keys(task.refs).some(function (k) {
                        return payload.ref.match(task.refs[k]);
                    });
                    if (!suitableRef) return logger(request.url + '.info').log('Ref does not fit. Aborting.');
                }
            }

            if (task.commands.length) {
                //Access to payload and task from command definition
                task.commands.map(function(el, i) {
                    try{
                        return el.fmt({payload:payload, task:task});
                    } catch(e) {
                        logger(request.url + '.info').log('Command must be string.' + e.stack);
                        return '';
                    }
                });
                
                queue.push(request.url, task);
            } else {
                return logger(request.url + '.info').log('No commands to execute.');
            }
        });

        response.end("Task added to queue!");
    } else {
        response.writeHead(200);
        response.end("There is something, you don't need know.");
    }
}).listen(process.env.PORT, process.env.IP);
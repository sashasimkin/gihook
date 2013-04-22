//Dependencies
var http = require("http");
var fs = require("fs");
var path = require("path");
var child_process = require('child_process');
var log = require("./logging");
//Runtime variables
var cfg_dir = __dirname + '/config/';
var cfg_map = {};

//Server options
var run_argv = process.argv[2] ? process.argv[2].split(':') : [];
process.env.IP = process.env.IP || run_argv[0] || '0.0.0.0';
process.env.PORT = process.env.PORT || run_argv[1] || 8001;

var processFile = function (fileName) {
    var filePath = cfg_dir + fileName;
    var fileExt = path.extname(fileName);
    if (fileExt != '.json') {
        return log('Problem with file "' + filePath + '". There must be .json file extension.', 'runtime');
    }

    fs.readFile(filePath, 'utf-8', function (err, data) {
        var cfg = {};
        try {
            if (err) throw err;

            cfg = JSON.parse(data);
            if ([cfg.path, cfg.user, cfg.commands].indexOf(undefined) !== -1) {
                throw new Error('Bad config file "' + filePath + '". It need to be json object with path, user and commands keys.');
            }
        } catch (e) {
            return log('Error while processing file "' + filePath + '": ' + e, 'runtime');
        }
        //Populate good cfg object to objects map by filename without extension
        return cfg_map[path.basename(fileName, fileExt)] = cfg;
    });
};

// Readfiles to object on server start
fs.readdir(cfg_dir, function (wtf, files) {
    var watchCallback = function (prev, next) {
        processFile(files[i]);
    };

    for (var i in files) {
        try {
            processFile(files[i]);
            fs.watchFile(cfg_dir + files[i], watchCallback);
        } catch (e) {
            log(e, 'startup');
        }
    }

    //Watch for changes
    fs.watch(cfg_dir, function (event, fileName) {
        processFile(fileName);
    });
});

//Declare queue container
var queue = {};

//Function for task-up
var runTask = function(task) {
    queue[task.name].running = true;
    var cmd = task.commands.shift();
    if(!cmd){
        return (queue[task.name].running = false);
    }
    
    var proc = child_process.spawn(cmd.shift(), cmd, task.options),
        cmd_string = cmd.join(' '),
        stdout = '',
        stderror = '';
    
    proc.stdout.on('data', function(data) { stdout += data; });
    proc.stderr.on('data', function(data) { stderror += data; });
    proc.on('exit', function (code, signal) {
        //Log results of current command
        if(stdout) log('Data from "' + cmd_string + '": ' + stdout, task.name + '.info');
        if(stderror) log('Errors in "' + cmd_string + '": ' + stderror, task.name + '.error');
        //Run next task, pass reference to current task
        runTask(task);
    });
};

//Run task sheduler, lol
setInterval(function () {
    for(var name in queue){
        if(queue[name].tasks.length && !queue[name].running){
            runTask(queue[name].tasks.shift());
        }
    }
}, 1000);

//Create Server
http.createServer(function (request, response) {
    //Strip request.url, remove first slash
    request.url = request.url.slice(1);
    //Prevent favicon.ico requests
    if (request.url == 'favicon.ico') return request.connection.destroy();

    if (request.method == 'POST' && cfg_map[request.url]) {
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
                var bodyObj = JSON.parse(body);
            } catch (e) {
                return log('Malformed json. Request body: ' + body, request.url + '.error');
            }
            
            //We need object copy!
            var cfg = JSON.parse(JSON.stringify(cfg_map[request.url]));
            var spawn_options = {
                encoding: "utf-8",
                env: process.env
            };

            if (cfg.user) {
                spawn_options.uid = cfg.user;
            }

            try {
                fs.readdirSync(cfg.path);
                spawn_options.cwd = cfg.path;
            } catch (e) {
                return log('Invalid path "' + cfg.path + '" in config "' + request.url + '"', request.url + '.error');
            }

            if (cfg.refs) {
                var refsType = typeof cfg.refs;
                if (['string', 'object'].indexOf(refsType)) {
                    if (refsType == 'string') cfg.refs = [cfg.refs];

                    var suitableRef = Object.keys(cfg.refs).some(function (k) {
                        return bodyObj.ref.match(cfg.refs[k]);
                    });
                    if (!suitableRef) return log('Ref does not fit. Aborting.', request.url + '.info');
                }
            }

            if (cfg.commands.length) {
                cfg.name = request.url;
                cfg.options = spawn_options;
                if(typeof queue[request.url] == 'object'){
                    queue[request.url].tasks.push(cfg);
                } else {
                    queue[request.url] = {
                        running: false,
                        tasks: [ cfg ]
                    };
                }
            } else {
                return log('No commands to execute.', request.url + '.info');
            }
        });

        response.end("Task added to queue!");
    } else {
        response.writeHead(200);
        response.end("There is something, you don't need know.");
    }
}).listen(process.env.PORT, process.env.IP);
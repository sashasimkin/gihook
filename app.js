//Dependencies
var http = require("http");
var fs = require("fs");
var path = require("path");
var exec = require('child_process').exec;
var log = require("./lib/log");
var TaskManager = require("./lib/TaskManager");

//IP and PORT for web-server
var run_argv = process.argv[2] ? process.argv[2].split(':') : [];
process.env.IP = process.env.IP || run_argv[0] || '0.0.0.0';
process.env.PORT = process.env.PORT || run_argv[1] || 8001;

//Runtime variables
var cfg = {
    dir: __dirname + '/config/',
    map: {}
};

/**
 * Validate file and add to cfg map if valid
 */
var processFile = function (fName) {
    var fPath = path.join(cfg.dir, fName),
        fExt = path.extname(fName);
    
    if (fExt != '.json') return log('Problem with file "' + fPath + '". There must be .json file extension.', 'runtime');
    
    try{
        delete require.cache[fPath];
        var data = require(fPath);
        
        if (!(data.path && typeof data.commands == 'object' && data.commands.length)) {
            throw new Error('Bad config file "' + fPath + '". It need to be json object with path and commands keys.');
        }
        
        fs.readdirSync(data.path);
        
        return cfg.map[path.basename(fName, fExt)] = data;
    } catch(e) {
        return log('Error while processing file "' + fPath + '": ' + e, 'runtime');
    }
};

/**
 * Callback for file-watchers
 */
var watchCallback = function(file) {
    processFile(file);
    return function (curr, prev) {
        if(prev.mtime != curr.mtime) processFile(file);
    };
};
//Readfiles to object on app start
fs.readdir(cfg.dir, function (err, files) {
    if(err) return log(err, 'startup');
    
    files.map(function(file, i) {
        try {
            fs.watchFile(path.join(cfg.dir, file), watchCallback(file));
        } catch (e) {
            log(e, 'startup');
        }
    });
});

//Watch for changes in directory
fs.watch(cfg.dir, function (event, fName) {
    processFile(fName);
});

var runTask = function (task) {
    task.running();
    var command = task.commands.shift();
    if (!command) {
        return task.finished();
    }
    
    exec(command, task.options, function(err, stdout, stderr) {
        if (stdout) log('Data from "' + command + '": ' + stdout, task.name + '.info');
        if (stderr) log('Error in "' + command + '": ' + stderr, task.name + '.error');
        
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
                var bodyObj = JSON.parse(body);
            } catch (e) {
                return log('Malformed json. Request body: ' + body, request.url + '.error');
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
                        return bodyObj.ref.match(task.refs[k]);
                    });
                    if (!suitableRef) return log('Ref does not fit. Aborting.', request.url + '.info');
                }
            }

            if (task.commands.length) {
                queue.push(request.url, task);
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
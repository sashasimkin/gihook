//Dependencies
var http = require("http");
var fs = require("fs");
var path = require("path");
var child_process = require('child_process');
var log = require("./logging");
//Runtime variables
var cfg_dir = __dirname + '/config/';
var cfg_map = {};

var processFile = function(fileName){
    var filePath = cfg_dir + fileName;
    var fileExt = path.extname(fileName);
    if(fileExt != '.json'){
        return log('Problem with file "' + filePath + '". There must be .json file extension.');
    }
    
    fs.readFile(filePath, 'utf-8', function(err, data) {
        try{
            if(err) throw err;
            
            var cfg = JSON.parse(data);
            if([cfg.path, cfg.user, cfg.commands].indexOf(undefined) !== -1){
                throw new Error('Bad config file "' + filePath + '". It need to be json object with path, user and commands keys.');
            }
        } catch(e) {
            return log('Error while processing file "' + filePath + '": ' + e);
        }
        //Populate good cfg object to objects map by filename without extension
        return cfg_map[path.basename(fileName, fileExt)] = cfg;
    });
};

// Readfiles to object on server start
fs.readdir(cfg_dir, function(wtf, files){
    for(var i in files){
        try{
            processFile(files[i]);
            fs.watchFile(cfg_dir + files[i], function(prev, next) {
                processFile(files[i]);
            });
        } catch(e) {
            log(e);
        }
    }
    
    //Watch for changes
    fs.watch(cfg_dir, function(event, fileName) {
        processFile(fileName);
    });
});

//Server options
if(process.argv[3]){
    var run_argv = process.argv[3].split(':');
    process.env.IP = run_argv[0] || '0.0.0.0';
    process.env.PORT = run_argv[1];
}
process.env.IP = process.env.IP || '0.0.0.0';
process.env.PORT = process.env.PORT || 6666;

// create a server
http.createServer(function(request, response) {
    request.url = request.url.slice(1);
    
    //Prevent favicon.ico requests
    if(request.url == 'favicon.ico') return request.connection.destroy();
    
    if(request.method == 'POST' && cfg_map[request.url]){
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                request.connection.destroy();
            }
        });
        
        request.on('end', function () {
            var bodyObj = JSON.parse(body.trim());
            var cfg = cfg_map[request.url];
            var spawn_options = {
                encoding: "utf-8",
                env: process.env
            };
            
            if(cfg.user) {
                spawn_options.uid = cfg.user;
            }
            
            if(!fs.readdirSync(cfg.path)) {
                return log('Invalid path "' + cfg.path + '" in config "' + request.url + '"');
            }
            spawn_options.cwd = cfg.path;
            
            var refsType = typeof cfg.refs;
            if(['string', 'object'].indexOf(refsType)){
                if(refsType == 'string') cfg.refs = [cfg.refs];
                var refNotMatch = true;
                for(var key in cfg.refs){
                    if(bodyObj.ref.match(cfg.refs[key])) {
                        refNotMatch = false;
                        break;
                    }
                }
                if(refNotMatch) return log('No refs match. Aborting.');
            }
            
            if(cfg.commands.length){
                var onData = function(data) {
                    log('Command "' + commandString + '" with data: ' + data);
                };
                var onError = function(data) {
                    log('Error in command "' + commandString + '" with data: ' + data);
                };
                
                for(var i in cfg.commands){
                    var commandArray = cfg.commands[i];
                    var commandString = commandArray.join(' ');
                    var result = child_process.spawn(commandArray.shift(), commandArray, spawn_options);
                    
                    result.stdout.on('data', onData);
                    result.stderr.on('data', onError);
                }
            }
        });
        
        response.end("Deploy in queue!");
    } else {
        response.writeHead(404, 'There is nothing.');
        response.end("404;");
    }
}).listen(process.env.PORT, process.env.IP);

process.env.IP = process.env.IP || '0.0.0.0';
process.env.PORT = process.env.PORT || 6666;
//Rewrite for logging to files
var dbg = true;
function log(msg, file){
    if(file){
        //Write to file
    } else {
        console.log(msg);
        if(dbg && typeof msg == 'object'){
            console.dir(msg);
        }
    }
    
    return false;
}
//Dependencies
var http = require("http");
var fs = require("fs");
var path = require("path");
// var os = require("os");
var child_process = require('child_process');
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

// create a server
http.createServer(function(request, response) {
    request.url = request.url.slice(1);
    //Fucking favicon.ico!
    if(request.url == 'favicon.ico'){
        return request.connection.destroy();
    }
    
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
            var bodyObj = JSON.parse(body.trim())
            log(body);
            
            var cfg = cfg_map[request.url];
            var spawn_options = {
                encoding: "utf-8",
                env: process.env
            };
            if(cfg.user) spawn_options.uid = cfg.user;
            
            if(!fs.readdirSync(cfg.path)){
                return log('Invalid path "' + cfg.path + '" in config "' + request.url + '"');
            }
            spawn_options.cwd = cfg.path;
            
            var refsType = typeof cfg.refs;
            if(['string', 'object'].indexOf(refsType = typeof cfg.refs)){
                if(refsType == 'string') cfg.refs = [cfg.refs];
                var cont = false;
                for(var key in cfg.refs){
                    if(bodyObj.ref.match(cfg.refs[key])) {
                        cont = true;
                        break;
                    }
                }
                if(!cont) return log('No refs match. Aborting.');
            }
            
            if(cfg.commands.length){
                var handleExec = function(err, stdout, stderr) {
                    if(err){log(err);}
                    
                    
                };
                
                for(var i in cfg.commands){
                    var commandArray = cfg.commands[i];
                    var commandString = commandArray.join(' ');
                    var result = child_process.spawn(commandArray.shift(), commandArray, spawn_options);
                    
                    result.stdout.on('data', function (data) {
                        log('Command "' + commandString + '" with data: ' + data);
                    });

                    result.stderr.on('data', function (data) {
                        log('Error in command "' + commandString + '" with data: ' + data);
                    });
                }
            }
            //Do work according to hook data
        });
    }
    // on every request, we'll output 'Hello world'
    response.end("I'm alive!");
}).listen(process.env.PORT, process.env.IP);

// Note: when spawning a server on Cloud9 IDE, 
// listen on the process.env.PORT and process.env.IP environment variables

// Click the 'Run' button at the top to start your server,
// then click the URL that is emitted to the Output tab of the console

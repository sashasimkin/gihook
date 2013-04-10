//Rewrite for logging to files
var dbg = true;
function log(msg, file){
    if(dbg && file){
        //Write to file
    } else {
        console.log(msg);
    }
    
    return false;
}
var log = console.log;
//Dependencies
var http = require("http");
var fs = require("fs");
var path = require("path");
// var os = require("os");
var exec = require('child_process').exec;
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
            return log(e);
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
            var cfg = cfg_map[request.url];
            if(cfg.user){
                //Change user
            }
            if(!fs.readdirSync(cfg.path)){
                return log('Invalid path "' + cfg.path + '" in config "' + request.url + '"');
            }
            if(cfg.commands.length){
                var handleExec = function(err, stdout, stderr) {
                    if(err){log(err);}
                    
                    
                };
                for(var i in cfg.commands){
                    exec(cfg.commands[i], {
                        cwd: cfg.path,
                        encoding: 'utf-8'
                    }, handleExec);
                }
            }
            //Do work according to hook data
            log(body);
        });
    }
    // on every request, we'll output 'Hello world'
    response.end("I'm alive!");
}).listen(process.env.PORT, process.env.IP);

// Note: when spawning a server on Cloud9 IDE, 
// listen on the process.env.PORT and process.env.IP environment variables

// Click the 'Run' button at the top to start your server,
// then click the URL that is emitted to the Output tab of the console

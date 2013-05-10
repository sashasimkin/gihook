var fs = require("fs");
var path = require("path");

var log_dir = path.join(process.cwd(), 'logs');

Date.prototype.toLocaleFormat = function(format) {
    var f = {y : this.getYear() + 1900,m : this.getMonth() + 1,d : this.getDate(),H : this.getHours(),M : this.getMinutes(),s : this.getSeconds()};
	for(var k in f){
        format = format.replace('%' + k, f[k] < 10 ? "0" + f[k] : f[k]);
	}
	return format;
};

var writeError = function(err) {
    if(err) {
        console.log(err, err.stack);
    }
};

exports = module.exports = function(file){
    return {
        log: function() {
            for(var i in arguments){
                if(!arguments.hasOwnProperty(i)) continue;
                
                console.log(arguments[i]);
                if(file){
                    var toWrite = '[' + new Date().toLocaleFormat('%d.%m.%y %H:%M:%s') + ']' + arguments[i] + '\n';
                    if(arguments[i].stack) {
                        toWrite += '---Call stack:---\n' + arguments[i].stack + '\n---End Call stack---\n';
                    }
                    
                    fs.appendFile(path.join(log_dir, file + '.log'), toWrite, writeError);
                }
            }
    
            return false;
        }
    };
};
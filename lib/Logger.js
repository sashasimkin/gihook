var fs = require("fs");
var path = require("path");

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

exports = module.exports = function Logger(file){
    var log = function(type) {
        var fileName;
        if(Logger.directory) {
            fileName = path.resolve(Logger.directory, file + '.' + type + '.log');
        } else {
            fileName = false;
        }

        var args = Array.prototype.slice.call(arguments);
        args.shift();

        for(var i in args){
            if(!args.hasOwnProperty(i)) continue;
            var arg = args[i];

            var toWrite = '[' + new Date().toLocaleFormat('%d.%m.%y %H:%M:%s') + ']' + arg;
            if(arg.stack) {
                toWrite += '\n---Call stack:---\n' + arg.stack + '\n---End Call stack---\n';
            } else {
                toWrite += '\n';
            }
            if(fileName) {
                fs.appendFile(fileName, toWrite, writeError);
            } else {
                console.log(toWrite);
            }
        }

        return false;
    };

    var actualLogger = function(type) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(type);

            return log.apply(this, args);
        };
    };

    this.info = actualLogger('info');
    this.error = actualLogger('error');
};
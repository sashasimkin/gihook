var fs = require("fs");
var path = require("path");
var util = require("util");

var dbg = true;
var logs_dir = __dirname + '/../logs';

Date.prototype.toLocaleFormat = function(format) {
    var f = {y : this.getYear() + 1900,m : this.getMonth() + 1,d : this.getDate(),H : this.getHours(),M : this.getMinutes(),s : this.getSeconds()};
	for(var k in f){
        format = format.replace('%' + k, f[k] < 10 ? "0" + f[k] : f[k]);
	}
	return format;
};

exports = module.exports = function(msg, file){
    console.log(msg);
    if(dbg && typeof msg == 'object'){
        console.dir(msg);
    }
    if(file){
        var toWrite = '[' + new Date().toLocaleFormat('%d.%m.%y %H:%M:%s') + ']' + msg + '\n';
        if(msg.stack) {
            toWrite += '---Call stack:---\n' + msg.stack + '\n---End Call stack---\n';
        }
        
        fs.appendFile(path.join(logs_dir, file + '.txt'), toWrite, function (err) {
            if(err) {
                arguments.callee(err);
            }
        });
    }
    
    return false;
}
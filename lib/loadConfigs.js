var fs = require("fs");
var path = require("path");
var logger = require('./logger');

exports = module.exports = function (dir, stack) {
    /**
     * Validate file and add to cfg map if valid
     */
    var processFile = function (fName) {
        var fPath = path.join(dir, fName),
            fExt = path.extname(fName);

        if (fExt != '.json') return logger('runtime').log('Problem with file "' + fPath + '". There must be .json file extension.');

        try {
            delete require.cache[fPath];
            var data = require(fPath);

            if (!(data.path && typeof data.commands == 'object' && data.commands.length)) {
                throw new Error('Bad config file "' + fPath + '". It need to be json object with path and commands keys.');
            }

            fs.readdirSync(data.path);

            return stack[path.basename(fName, fExt)] = data;
        } catch (e) {
            return logger('runtime').log('Error while processing file "' + fPath + '": ' + e);
        }
    };

    //Readfiles to object on app start
    fs.readdir(dir, function (err, files) {
        if (err) return logger('startup').log(err);

        files.map(function (file, i) {
            processFile(file);
        });
    });
};
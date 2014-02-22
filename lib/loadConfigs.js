var fs = require("fs");
var path = require("path");
var Logger = require('./Logger');

exports = module.exports = function (sources) {
    var logger = new Logger('configsProcessor'),
        data = {};

    /**
     * Process single JSON-file to native-object
     *
     * @param fPath Path to file which must be processed
     * @returns {*}
     */
    var processFile = function (fPath) {
        var fExt = path.extname(fPath);

        // Only json now :-)
        if (fExt != '.json') return logger.info('Skip file "' + fPath + '". There must be .json file extension.');

        try {
            delete require.cache[fPath];
            var config = require(fPath);

            if (!(config.path && typeof config.commands == 'object' && config.commands.length)) {
                logger.error('Bad config file "' + fPath + '". It need to be json object with path and commands keys.');
            }

            // Set this to data hash with key as file basename without extension
            return data[path.basename(fPath, fExt)] = config;
        } catch (e) {
            return logger.error('Error while processing file "' + fPath + '"', e);
        }
    };

    // Populate data by processFile calls on found files
    sources.forEach(function(sPath) {
        sPath = path.resolve(process.cwd(), sPath);

        try{
            var stat = fs.lstatSync(sPath);

            if (stat.isDirectory()) {
                try{
                    var files = fs.readdirSync(sPath);

                    files.map(function (file) {
                        processFile(path.join(sPath, file));
                    });

                } catch (e) {
                    logger.error('Problem with directory: "' + sPath + '"', e);
                }
            } else if(stat.isFile()) {
                processFile(sPath);
            }
        } catch(e) {
            logger.error('Error while processing source: "' + sPath + '"', e);
        }
    });

    return data;
};
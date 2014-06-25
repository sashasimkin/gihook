var inherit = require('inherit');
var fs = require('fs');
var _ = require('underscore');
var Logger = require('./Logger');


exports = module.exports = inherit(function Config(filename, defaults) {
  // Load file contents into memory
  this.filename = filename;
  delete require.cache[filename];
  
  this.logger = new Logger(filename.split('/').slice(-1)[0].split('.')[0]);
  
  try {
    this.data = require(filename);
  } catch (e) {
    this.data = {};
    
    // Write error, but maybe it's a new config
    this.logger.error(e);
  }

  _.defaults(this.data, defaults);
}, { // Object props
  queue: [],  // Tasks for config
  
  save: function () {
    var _this = this,
    data = JSON.stringify(this.data, null, 2);
    
    fs.writeFile(this.filename, data, function (err) {
      // Do something with error
      if(err) {
        _this.logger.error(err);
      }
    });
  },
  // Support for deep notation in get and set
  get: function (key) {
    return this.data[key];
    // Get value from object
  },
  set: function (key, value) {
    // Write value to object
    this.data[key] = value;
    
    return this;
  }
});
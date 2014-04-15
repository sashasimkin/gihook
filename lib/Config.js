var inherit = require('inherit');
var fs = require('fs');
var _ = require('underscore');

exports = module.exports = inherit(function Config(filename, defaults) {
  // Load file contents into memory
  this.filename = filename;
  delete require.cache[filename];
  try {
    this.data = require(filename);
  } catch (e) {
    this.data = {};
    // Write error
  }

  _.defaults(this.data, defaults);
}, { // Object props
  queue: [],
  save: function () {
    var data = JSON.stringify(this.data, null, 2);
    fs.writeFile(this.filename, data, function (err) {
      // Do something with error
    });
  },
  // Support for deep notation in get and set
  get: function (key) {
    // Get value from object
  },
  set: function (key, value) {
    // Write value to object
  }
});
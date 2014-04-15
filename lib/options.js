exports = module.exports = function() {
  var opts = require("nomnom")
    .option('config', {
      list: true,
      abbr: 'c',
      default: ['config'],
      help: 'Directories which contains JSON files or paths to JSON-files'
    }).option('address', {
      position: 0,
      help: 'Specify address bind to. E.g. 127.0.0.1:3005 or 0.0.0.0 or only port 3005 address by default 0.0.0.0',
      default: '0.0.0.0:3000'
    }).option('logs', {
      abbr: 'l',
      help: 'Set directory for logs, if not set - fallback to logging in console',
      default: false
    }).option('debug', {
      abbr: 'd',
      help: 'Enable logging to console',
      flag: true,
      default: false
    }).parse();

  // IP and PORT for web-server
  // Support setting this as env vars
  var address = opts.address ? String(opts.address).split(':') : [];
  if(address.length == 1) {
    if(!isNaN(parseFloat(address[0])) && isFinite(address[0])) {
      address = ['0.0.0.0', parseInt(address[0])];
    } else {
      address = [address[0], 3000];
    }
  }

  opts.IP = process.env.IP || address[0];
  opts.PORT = process.env.PORT || address[1];

  return opts;
};
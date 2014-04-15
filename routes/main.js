exports = module.exports = {
  // Main route that responsible for each request
  main: function (configs) {
    'use strict';

    return function (req, res) {
      //Strip request.url, remove first slash
      var config_name = req.params.config;
      var config = configs[config_name];
      var logger = new Logger(config_name);

      if (!config || req.body.zen) {
        logger.error('Invalid request for config: ' + config_name);
        // Log invalid request
        return;
      }

      var payload = req.body;
      //We need object copy!
      var task = JSON.parse(JSON.stringify(config));
      task.name = config_name;
      task.options = {
        encoding: "utf-8",
        env: process.env,
        cwd: task.path
      };
      if (task.refs) {
        var refsType = typeof task.refs;
        if (['string', 'object'].indexOf(refsType)) {
          if (refsType == 'string') task.refs = [task.refs];
          var suitableRef = Object.keys(task.refs).some(function(k) {
            return payload.ref.match(task.refs[k]);
          });
          if (!suitableRef) return logger.info('Ref does not fit. Aborting.');
        }
      }

      // Pre-process commands related to request
      if (task.commands.length) {
        //Access to payload and task from command definition
        task.commands.filter(function(command, i) {
          if (command.fmt) {
            task.commands[i] = command.fmt({
              payload: payload,
              task: task
            });
            return true;
          } else {
            return logger.info('Unexpected command "{c}". Command must be a string.'.fmt({c: command}));
          }
        });

        // And deal with it for this time. Now let the queue sort it
        queue.push(config_name, task);

        logger.info('Got valid request on: ' + config_name);
      } else {
        return logger.info('No commands to execute.');
      }

      res.send(".");
    }
  },
  fallback: function(req, res) {
    res.send("There is nothing. Go ahead!");
  },
  dashboard: function(req, res) {

  }
};
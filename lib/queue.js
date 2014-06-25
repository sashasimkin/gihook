exports = module.exports = (function() {
    var kue = require('kue')
  , jobs = kue.createQueue();
  
  var callback = function() {},
      registry = {};
  
  
  return {
      push: function(name, task) {
          var i_name = 'task_' + name;
          
          if(!registry[i_name]) {
              registry[i_name] = true;
              jobs.process(i_name, callback);
          }
          
          var job = jobs.create(i_name, task).save();
      },
      _jobs: jobs
  };
})();
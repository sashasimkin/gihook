var sh = require('execSync');

process.on('message', function (task) {
  // Do something with value
  var result = '';

  for (var i in task.commands) {
    if(!task.commands.hasOwnProperty(i)) continue;

    var command = task.commands[i];
    var cRes = sh.exec(command);

    result += cRes.stdout;

    if(cRes.code !== 0) {
      break;
    }
  }

  // Send result of execution to parent
  process.send(result);
});
About
===
Git [web-hook](https://help.github.com/articles/post-receive-hooks) receiver written in node.js.
Created for prevent a routine work, such as working with database, static files, etc., after pushing changes to repo.


Requirements
===
* nodejs >= v0.6.21
* OS: Linux(tested on Ubuntu), *BSD(Not tested)


Instalation
===
```
git clone git://github.com/sashasimkin/hook-receiver.git
```
1. `cd hook-reciever/`
2. `chmod 0777 logs/`
2. Create file `{name}.json` with config object in directory `config/` (Below about its contents).
3. run server `node app.js IP:PORT` (IP non-required, but if you filled port only the command must looks like `node app.js :PORT`). Defaults `IP="0.0.0.0";PORT=8001`.
4. Use `http://IP:PORT/{name}` as hook url in github, gitlab, etc.


Configuration:
===
It is a json file with json object inside in directory config/. This configuration used every time when hook has been recieved.


Configuration parameters:
===
* `path` - Root path for project, shell commands has been executed here
* `commands` - Array of shell commands, which will be performed after recieve hook
* `refs` - payload.ref to match. String or array of strings which will be substituted to ref.match()


TODO
===
* Add lib/format.js for use as String.ftm, and accept {task: task, payload: bodyObj} to any config entry
* cfg.require parameter - such as cfg.commands, but for javascript files 
(Ex: `with({task: task, payload: bodyObj}){ require(cfg.require[i]); }`) after executing cfg.commands

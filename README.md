About
===
Git web-hook receiver written in node.js.
Created for prevent a routine work after commit. Useful if you have a server for deploy and using git :-)

Requirements
===
* nodejs >= v0.6.21
* System: Linux(tested on Ubuntu), *BSD(Not tested)

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
* `refs` - Commits ref to match. String or array of strings which will be substituted to ref.match()


TODO
===
* Variables in command definition
* Commands string instade of array
* cfg.require parameter - such as cfg.commands, but javascript files for inclusion
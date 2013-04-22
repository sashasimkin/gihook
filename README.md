About
===
Git web-hook receiver written in node.js.
Created for prevent a routine work after commit. Useful if you have a server for deploy and when using git :-)

Requirements
===
* nodejs >= v0.6.21
* System: linux, *bsd(tested on Ubuntu)

Instalation
===
```
git clone git://github.com/sashasimkin/hook-receiver.git
```

Usage
===
1. Create file {{name}}.json with config object in dir config/ below about this).
2. node app.js IP:PORT (IP non-required, but if you filled port only the command must looks like `node app.js :PORT`). Defaults `IP='0.0.0.0';PORT=8001`.
3. Use `http://IP:PORT/{{name}}` as hook url in github, gitlab, etc.
4. Set chmod 0777 on logging/logs/

Configuration:
===
It is a json file with json object inside in directory config/. This configuration used every time when hook has been recieved.

Configuration parameters:
===
* `user` - System user, from which will be performed commands
* `path` - root path for project, shell commans has been executed there
* `commands` - Shell commands, which will be performed after recieve hook
* `refs` - Non-required, if ref not match, any operation will not be performed. string or array of strings which be substituted to ref.match()


TODO
===
* Queue class with container inside and few helper methods, shift the save state problem on it.
* Get user id in system (id -u {cfg.user})
* Variables in command definition
* Commands string instade of array.
* cfg.require parameter with applying the cfg.commands results

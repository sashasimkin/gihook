About
===
Git web-hook receiver written in node.js

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
2. node app.js IP:PORT (IP non-required, but if you filled port only the command must looks like `node app.js :PORT`). Defaults `IP='0.0.0.0';PORT=6666`.
3. Use `http://IP:PORT/{{name}}` as hook url in github, gitlab, etc.

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
* Commands string instade of array.
* cfg.require parameter with applying the cfg.commands results
About
===
Git [web-hook](https://help.github.com/articles/post-receive-hooks) receiver written in node.js.
Created for prevent a routine work, such as working with database, static files, etc., after pushing changes to repo.


Requirements
===
* nodejs >= v0.6.21
* OS: Linux(tested on Ubuntu, Debian), *BSD(Not tested)


Instalation
===
There are two ways to install:

First, preferred way by installing from npm:

1. `npm install -g gihook`

Than you have command `gihook` available.


Second is cloning repo and use it as:

1. `git clone https://github.com/sashasimkin/gihook.git`
2. `cd gihook && chmod 0777 logs/`

Than use it as `forever app.js --params` or `npm link .` than you have command `gihook` available :-)


Usage
===
1. Create file `{name}.json` with config object in directory `config/`(Or any other that you pass to script) (Below about its contents).
2. Start it as gihook 0.0.0.0:3000 --config path/to/configs/dir [--config path/to/config/file.json -c /some/other/file.json] ...
3. Use `http://IP:PORT/{name}` as hook url in github, gitlab, etc.

If you want use it with forever ot anything such - start it as `forever \`which gihook\` [options ...]`
Write 'gihook -h' for more info.


Configuration:
===
Any endpoint has separated configuration which runs on each push.
It is file with json object inside in directory config/(By default, if you install from repo) or directories and files you specify.
Any file you pass to gihook must have `.json` file extension.


Configuration parameters:
===
* `path` - Root path for project, shell commands has been executed here
* `commands` - Array of shell commands, which will be performed after recieve hook (Supported {payload.*} and {task.*})
* `refs` - payload.ref to match. String or array of strings which will be substituted to ref.match()


Notes:
===
* Don't duplicate config names, in this case will be used config that loaded later
* For GitHub use `Just the push event.` setting. Payload version should be `json`. Other events currently not supported.
* Payload which received by gihook must contain `payload.ref` key


TODO:
===
* Write tests
* Look on this as alternative to own logger https://github.com/nomiddlename/log4js-node or this https://github.com/trentm/node-bunyan or https://github.com/flatiron/winston
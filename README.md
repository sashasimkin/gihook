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
1. `git clone https://github.com/sashasimkin/gihook.git`
2. `cd gihook && chmod 0777 logs/`
3. `npm install`
4. Create file `{name}.json` with config object in directory `config/` (Below about its contents).
5. run server `node app.js IP:PORT` (IP non-required, but if you filled port only the command must looks like `node app.js :PORT`). Defaults `IP="0.0.0.0";PORT=3000`.
6. Use `http://IP:PORT/{name}` as hook url in github, gitlab, etc.


Configuration:
===
It is a json file with json object inside in directory config/. This configuration used every time when hook has been recieved.


Configuration parameters:
===
* `path` - Root path for project, shell commands has been executed here
* `commands` - Array of shell commands, which will be performed after recieve hook (Supported {payload.*} and {task.*})
* `refs` - payload.ref to match. String or array of strings which will be substituted to ref.match()


Notes:
===
* For GitHub use `Just the push event.` setting. Payload version should be `json`. Other events currently not supported.
* Payload which received by gihook must contain `payload.ref` key
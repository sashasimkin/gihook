About
===
Git web-hook receiver written on node.js

Requirements
===
* nodejs >= v0.6.21
* System: linux, *bsd(tested on Ubuntu)

Instalation
===
git clone git://github.com/sashasimkin/hook-receiver.git

Usage
===
1. Create file %name%.json
2. Write config(below about this)(json object):
3. Change server PORT and IP(line 1-2)
4. node app.js
5. Use http://IP:PORT/%name% as hook url in github, gitlab, etc.

Config parameters:
===
* user - System user, from which will ne performed commands
* path - root path for project
* commands - Shell commands, which will be performed after receive hook
* refs - Non-required, if ref not match, any operation will not be performed. String or Array of Strings which be substituted to ref.match()


TODO
===
* Think about string-command executing
* require in config with shell commands results

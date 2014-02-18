var os = require("os");
var path = require("path");
var fs = require("fs");

exports = module.exports = function() {
    var self = this;
    var queue = {};
    var state_file = path.join(os.tmpdir(), 'gihook-state.json');
    
    //Custom not enumerable length for counting all tasks in queue
    Object.defineProperty(queue, "length", {
        writable: true,
        value: 0
    });
    
    self.saveState = function() {
        if(queue.length){
            fs.writeFile(state_file, JSON.stringify(queue), function(err) {});
        }
    };
    
    self.get = function() {
        if(queue.length) {
            for(var type in queue){
                if(queue[type].tasks.length && !queue[type].running){
                    queue.length--;
                    return queue[type].tasks.shift();
                }
            }
        }
        //If nothing
        return null;
    };
    
    //self.push(request.url, cfg)
    self.push = function(type, task) {
        queue.length++;
        if(!queue[type]) queue[type] = { running: false };
        if(!queue[type].tasks) queue[type].tasks = [];
        
        task.running = function() {
            return (queue[type].running = true);
        };
        task.finished = function() {
            return (queue[type].running = false);
        };
        
        queue[type].tasks.push(task);
    };
    
    //Add try-catch, or not.
    self.run = function(callback, delay) {
        return setInterval(function() {
            var task = self.get();
            if(task){
                self.saveState();
                callback.apply(task);
            }
        }, delay);
    };
    
    self.stop = function(id){
        return clearInterval(id);
    };
    
    try{
        //It maybe alredy included, I dont know how. In any case does not prevent
        delete require.cache[state_file];
        queue = require(state_file);
        //Mark all tasks as stopped, if we fall when some task executing
        for(var k in queue) queue[k].running = false;
    } catch(e) {}
    
    return self;
};
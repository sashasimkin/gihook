/*
If initial data provided - write in intrnal structure
*/
exports = module.exports = function(initial) {
    var self = this;
    var queue = {};
    self.count = 0;
    
    this.get = function() {
        if(self.count) {
            for(var type in queue){
                if(queue[type].tasks.length && !queue[type].running){
                    self.count--;
                    return queue[type].tasks.shift();
                }
            }
        }
        //If nothing
        return null;
    };
    
    //self.push(request.url, cfg)
    this.push = function(type, task) {
        self.count++;
        if(!queue[type]) queue[type] = { running: false };
        if(!queue[type].tasks) queue[type].tasks = [];
        
        task.started = function() {
            return (queue[type].running = true);
        };
        task.stopped = function() {
            return (queue[type].running = false);
        };
        
        queue[type].tasks.push(task);
    };
    
    //Add try-catch, or not.
    this.run = function(callback, delay) {
        return setInterval(function() {
            var task = self.get();
            if(task){
                callback.bind(task)();
            }
        }, delay);
    };
    
    this.stop = function(id){
        return clearInterval(id);
    };
    
    return this;
};
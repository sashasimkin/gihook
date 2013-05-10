exports = module.exports = function(data){
    return this.toString().replace(/\{([\w\.]+)\}/g, function(str, key, offset, fullstring) {
        try{
            var res = eval('data.' + key);
            if(!res) throw new Error('Key does not exist');
        } catch(e) {
            res = str;
        }
        return res;
    });
};
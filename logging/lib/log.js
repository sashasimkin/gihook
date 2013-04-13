var dbg = true;
var dir = __dirname + '/../logs';

exports = module.exports = function(msg, file){
    if(file){
        //TODO: Write to file
    } else {
        console.log(msg);
        if(dbg && typeof msg == 'object'){
            console.dir(msg);
        }
    }
    
    return false;
}
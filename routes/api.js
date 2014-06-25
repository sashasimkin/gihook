var express = require("express");

var router = express.Router();

router.route('/api')
.get(function(req, res) { // Get existing configs
  
}).post(function(req, res) { // Create new config
        
});


router.route('/api/:config')
.get(function(req, res) {  // Get single config
  
})
.put(function(req, res) {  // Save existing config
  
})
.delete(function(req, res) {  // Delete config
  
});

exports = module.exports = router;
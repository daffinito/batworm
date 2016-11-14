var express = require('express');
var router = express.Router();

router.get('/directives/:template', function (req, res, next) {
   res.render('templates/directives/' + req.params.template);
});

module.exports = router;
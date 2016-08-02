'use strict';
var fs = require('fs');

/***************************** Endpoint Functions *****************************/

function _getchangelog(req, res) {
  fs.readFile('./resouces/app.asar/CHANGELOG.md', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    res.status(200).send(data);
  });
}

module.exports = function(app, cb) {
  app.router.get('/log', _getchangelog);

  if (cb) {
    cb();
  }
};

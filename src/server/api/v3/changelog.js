/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

'use strict';
var fs = require('fs');

/***************************** Endpoint Functions *****************************/

function _getchangelog(req, res) {
  fs.readFile('CHANGELOG.md', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    res.status(200).send(data);
  });
}

module.exports = function(app, cb) {
  app.router.get('/changelog', _getchangelog);

  if (cb) {
    cb();
  }
};

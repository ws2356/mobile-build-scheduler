var express = require('express');
var router = express.Router();

async function handleTask(req, res, next) {
  console.log('method: ', req.method);
  console.log('protocol: ', req.protocol);
  console.log('path: ', req.path);
  console.log('originalUrl: ', req.originalUrl);
  console.log('query: ', JSON.stringify(req.query));
  console.log('params: ', JSON.stringify(req.params));
  console.log('body: ', JSON.stringify(req.body, null, 2));
  res.end('ok');
}
/* GET users listing. */
router.get('/', wrapAsync(handleTask));
router.post('/', wrapAsync(handleTask));
router.put('/', wrapAsync(handleTask));

module.exports = router;

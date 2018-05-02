global.wrapAsync = fn => (req, res, next) => fn(req, res, next).catch((e) => {
  const err = e && e !== 'route' ? e : { caught: e };
  err.isServerError = true;
  next(err);
});

global.config = reqire('./config');

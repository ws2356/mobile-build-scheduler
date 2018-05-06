require('./global');

const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const buildRouter = require('./routes/build');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/build', buildRouter);

// catch 404 and forward to error handler
// not ne
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// eslint-disable-next-line
app.use((e, req, res, next) => {
  let err = e;
  if (err && err.isServerError) {
    err.status = err.status || 500;
  } else {
    err = err || createError(400);
    err.status = 400;
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status);
  res.end('error');
});

module.exports = app;


global.wrapAsync = fn => (...args) => fn(...args).catch(args[2]);

function timeStr() {
  return new Date().toString();
}

exports.logger = {
  debug(...args) {
    console.info(...[timeStr(), '-', 'DEBUG', '-'].concat(args));
  },
  info(...args) {
    console.info(...[timeStr(), '-', 'INFO', '-'].concat(args));
  },
  warn(...args) {
    console.warn(...[timeStr(), '-', 'WARN', '-'].concat(args));
  },
  error(...args) {
    console.warn(...[timeStr(), '-', 'ERROR', '-'].concat(args));
  }
};

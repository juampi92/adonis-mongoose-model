'use strict'

module.exports.isString = function (x) {
  return Object.prototype.toString.call(x) === "[object String]"
}

module.exports.splitOnCaps = function (x) {
  return x.split(/(?=[A-Z])/)
}

module.exports.firstLowerCase = function (string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

module.exports.nowAddDays = function(days = 0, date = null) {
  if (!date) date = new Date()
  console.log('adding', days, 'to', date)
  date.setDate(date.getDate() + days);
  return date;
}

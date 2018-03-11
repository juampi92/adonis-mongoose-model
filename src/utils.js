'use strict'

let utils = module.exports = {}

utils.isString = function (x) {
  return Object.prototype.toString.call(x) === '[object String]'
}

utils.splitOnCaps = function (x) {
  return x.split(/(?=[A-Z])/)
}

utils.firstLowerCase = function (string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

utils.nowAddDays = function (days = 0, date = new Date()) {
  date.setDate(date.getDate() + days)
  return date
}

const MONGOOSE_MIDDLEWARE_ACTIONS = ['pre', 'post']
const MONGOOSE_MIDDLEWARE = [
  'init', 'validate', 'save', 'remove',
  'find', 'update', 'findOne', 'findOneAndRemove',
  'findOneAndUpdate', 'aggregate', 'insertMany'
]

utils.isValidInstruction = function (instruction) {
  return MONGOOSE_MIDDLEWARE_ACTIONS.includes(instruction)
}

utils.isValidCommand = function (command) {
  return MONGOOSE_MIDDLEWARE.includes(command)
}

const LUCID_INSTRUCTIONS_TO_MONGOOSE = {
  'before': 'pre',
  'after': 'post'
}
const LUCID_COMMANDS_TO_MONGOOSE = {
  'delete': 'remove'
}

/**
 * Deconstructs the event name into instruction and command,
 * replacing common lucid commands into mongoose.
 *
 * @param {string} event
 * @returns {object} { instruction, command }
 */
utils.deconstructEvent = function (event) {
  let [instruction, ...commands] = utils.splitOnCaps(event)
  let command = utils.firstLowerCase(commands.join(''))

  if (LUCID_INSTRUCTIONS_TO_MONGOOSE.hasOwnProperty(instruction)) {
    instruction = LUCID_INSTRUCTIONS_TO_MONGOOSE[instruction]
  }

  if (LUCID_COMMANDS_TO_MONGOOSE.hasOwnProperty(command)) {
    command = LUCID_COMMANDS_TO_MONGOOSE[command]
  }

  return { instruction, command }
}

/**
 * Given an event name, it formats it into the mongoose format: instruction - command
 * Also detects if the event is invalid for mongoose, and transforms common Lucid
 * event names.
 *
 * @param {string} event
 */
utils.formatToMongooseMiddleware = function (event) {
  const { instruction, command } = utils.deconstructEvent(event)

  if (!utils.isValidInstruction(instruction)) {
    throw new Error(`${instruction} is not a valid mongoose command when using ${event}. Check the middleware docs: http://mongoosejs.com/docs/middleware.html`)
  }

  if (!utils.isValidCommand(command)) {
    throw new Error(`${command} is not a valid mongoose command when using ${event}. Check the middleware docs: http://mongoosejs.com/docs/middleware.html`)
  }

  return { instruction, command }
}

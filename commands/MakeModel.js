'use strict'

/*
 * adonis-mongoose
 *
 * (c) Juan Pablo Barreto <juampi92@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const { Command } = require('@adonisjs/ace')

/**
 * Command to create a validator
 *
 * @class MakeMongoose
 * @constructor
 */
class MakeMongoose extends Command {
  constructor (Helpers) {
    super()
    this.Helpers = Helpers
  }

  /* istanbul ignore next */
  /**
   * IoC container injections
   *
   * @method inject
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Helpers']
  }

  /* istanbul ignore next */
  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `make:mongoose
      { name? : Name of the Mongoose Model }
      { --simple : Ignore prompts when creating the model }
      { --raw : Creates a vanilla mongoose model }
    `
  }

  /* istanbul ignore next */
  /**
   * The command description
   *
   * @method description
   *
   * @return {String}
   */
  static get description () {
    return 'Make a mongoose Model'
  }

  /**
   * Method called when command is executed
   *
   * @method handle
   *
   * @param {Object} parameters
   * @param {String} parameters.name
   * @param {Object} options
   * @param {Boolean} options.simple = false
   * @param {Boolean} options.raw = false
   *
   * @return {void}
   */
  async handle ({ name = null }, { simple = false, raw = false }) {
    if (!name) {
      name = await this.ask('Enter model name')
    }

    const mustachePath = raw ? 'raw_model' : 'model'

    /**
     * Reading template as a string form the mustache file
     */
    const template = await this.readFile(path.join(__dirname, `./templates/${mustachePath}.mustache`), 'utf8')

    /**
     * Directory paths
     */
    const relativePath = path.join('app/Models', `${name}.js`)
    const validatorPath = path.join(this.Helpers.appRoot(), relativePath)

    /**
     * Split and pop to get the actual model name, only needs
     * to be full for pathing
     *
     * eg: adonis make:mongoose Directory/Model
     */
    name = name.split('/').pop()

    const options = {}

    if (!simple && !raw) {
      options.timestamps = await this
        .confirm('Include timestamps?')

      options.boot = await this
        .confirm('Include boot method?')
    }

    const templOptions = {
      name,
      exclude_timestamps: !simple ? !options.timestamps : false,
      include_boot: !simple ? options.boot : true
    }

    /**
     * If command is not executed via command line, then return
     * the response
     */
    if (!this.viaAce) {
      return this.generateFile(validatorPath, template, templOptions)
    }

    /* istanbul ignore next */
    /**
     * Otherwise wrap in try/catch and show appropriate messages
     * to the end user.
     */
    try {
      await this.generateFile(validatorPath, template, templOptions)
      this.completed('create', relativePath)
    } catch (error) {
      this.error(`${relativePath} validator already exists`)
    }
  }
}

module.exports = MakeMongoose

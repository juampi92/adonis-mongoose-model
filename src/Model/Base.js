/* global use */
'use strict'

require('@adonisjs/fold')

const mongoose = use('Adonis/Addons/Mongoose')
const { Schema } = mongoose

const utils = require('../utils')

class BaseModel {
  /**
   * Here is where you define hooks (middleware)
   *
   * @static
   * @memberof BaseModel
   */
  static boot ({ schema }) {

  }

  /**
   * Adds mongoose middleware in the form of hooks. The syntax is instructionCommand.
   * For example: preInit, postValidate, preSave, postRemove
   *
   * Instructions: pre, post
   * Command: init, validate, save, remove
   *
   * @static
   * @param {String} event
   * @param {String | Closure} callback
   * @chainable
   * @memberof BaseModel
   */
  static addHook (event, callback) {
    const { instruction, command } = utils.formatToMongooseMiddleware(event)

    // Resolve callback if is hook
    if (utils.isString(callback)) {
      // Import hook and link callback with hook's method
      callback = this.__importHook(callback)
    }

    this._schema[instruction](command, callback)

    return this
  }

  /**
   * Imports the hook class and wrapps the method into the mongoose's
   * middleware format
   *
   * @static
   * @param {String} name Name of the hook, format: ModelHook.methodname
   * @returns {Closure} callback
   * @memberof BaseModel
   */
  static __importHook (name) {
    const [className, methodName] = name.split('.')
    const hookClass = use('App/Models/Hooks/' + className)

    return async function (next) {
      try {
        await hookClass[methodName](this)
      } catch (err) {
        return next(err)
      }
      next()
    }
  }

  /**
   * You should replace this static property if you'd want to use
   * the buildModel functionality. Using this you can define your
   * schema inside your class definition.
   *
   * Read more: http://mongoosejs.com/docs/guide.html#definition
   *
   * @readonly
   * @static
   * @memberof BaseModel
   * @returns {Object}
   */
  static get schema () {
    throw new Error('You must override the static get schema() property')
  }

  /**
   * You should replace this static property id you'd want to use
   * custom schema options. This object is passed as a second parameter
   * when doing new Schema(schema, options).
   *
   * Read more: http://mongoosejs.com/docs/guide.html#options
   *
   * @readonly
   * @static
   * @memberof BaseModel
   */
  static get schemaOptions () {
    return {}
  }

  /**
   * Creates the mongoose's Schema, and it stores it into the static
   * property _schema
   *
   * This method is called when using 'buildModel' so you don't have to
   * if you don't need to
   *
   * @static
   * @param {Object} [options=undefined]
   * @memberof BaseModel
   * @returns {Schema}
   */
  static buildSchema (options = {}) {
    if (this._schema) {
      return this._schema
    }

    options = { options, ...this.schemaOptions }

    if (this.timestamps !== false) {
      options.timestamps = { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }

    this._schema = new Schema(this._getRawSchema(), options)
    this._schema.statics.primaryKey = this.primaryKey

    return this._schema
  }

  /**
   * Takes raw Schema, and applies adjustments
   *
   * @static
   * @returns
   * @memberof BaseModel
   */
  static _getRawSchema () {
    let schema = this.schema
    return schema
  }

  /**
   * Returns a created mongoose model, named like the name parameter.
   * It takes the
   *
   * @param {String} name
   * @returns {Mongoose Model}
   */
  static buildModel (name) {
    if (!name) {
      throw new Error('You must specify a model name on Model.buildModel("ModelName") ')
    }

    this.buildSchema()

    this._schema.loadClass(this)

    this.__createIndexes()

    this.boot({
      schema: this._schema
    })

    return mongoose.model(name, this._schema)
  }

  static index (...args) {
    // If the schema is yet not created
    if (!this._schema) {
      // Store indexes in temp array until the schema is created
      if (!this.__indexes) {
        this.__indexes = []
      }
      this.__indexes.push(args)
    } else {
      // Create the indexes right away
      this._schema.index(...args)
    }
  }

  static __createIndexes () {
    if (this.__indexes && this.__indexes.length) {
      this.__indexes.forEach((index) => this._schema.index(...index))
      this.__indexes = null
    }
  }

  /**
   * Class.primaryKey definition. You can customize it in case it's different in your model
   * This functionality is required for the Auth Schemas and Serializers
   *
   * Using id as default. ref: http://mongoosejs.com/docs/api.html#document_Document-id
   *
   * @readonly
   * @static
   * @memberof BaseModel
   * @returns {String}
   */
  static get primaryKey () {
    return 'id'
  }

  /**
   * Returns the primaryKey defined statically for the Model
   *
   * @readonly
   * @memberof BaseModel
   * @returns {String}
   */
  get primaryKey () {
    return this.constructor.primaryKey
  }

  /**
   * Returns the value for the primaryKey. Meaning it returns the
   * model's id. It can be an ObjectId, or whatever you want
   *
   * @readonly
   * @memberof BaseModel
   * @returns {Mixed}
   */
  get primaryKeyValue () {
    return this[this.primaryKey]
  }
}

module.exports = BaseModel

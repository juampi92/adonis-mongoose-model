'use strict'

const mongoose = use('Mongoose')
const { Schema } = mongoose

class BaseModel {
  /**
   * You should replace this static property if you'd want to use
   * the buildModel functionality. Using this you can define your
   * schema inside your class definition.
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
  static buildSchema (options = undefined) {
    if (!this._schema) {
      this._schema = new Schema(this._getRawSchema(), options)
      this._schema.statics.primaryKey = this.primaryKey

      if (this.timestamps !== false) {
        this._schema.pre('save', (next) => {
          this.updated_at = Date.now()
          next()
        })
      }
    }
    return this._schema
  }

  static _getRawSchema () {
    let schema = this.schema

    if (this.timestamps !== false) {
      schema.created_at = { type: Date, default: Date.now }
      schema.updated_at = { type: Date, default: Date.now }
    }

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

    return mongoose.model(name, this._schema)
  }

  /**
   * Class.primaryKey definition. You can customize it in case your model
   * does not use _id.
   * This functionality is required for the Auth Schemas and Serializers
   *
   * @readonly
   * @static
   * @memberof BaseModel
   * @returns {String}
   */
  static get primaryKey () {
    return '_id'
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

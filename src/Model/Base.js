'use strict'

class Base {
  static get primaryKey () {
    return '_id'
  }

  static getPrimaryKey () {
    return Base.primaryKey
  }

  get primaryKey () {
    return Base.getPrimaryKey()
  }

  get primaryKeyValue () {
    return this[Base.getPrimaryKey()]
  }
}

module.exports = Base

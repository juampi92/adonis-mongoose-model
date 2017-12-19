'use strict'

class Base {
  static get primaryKey () {
    return '_id'
  }

  get primaryKeyValue () {
    return this[this.primaryKey()]
  }
}

//Base.primaryKey = '_id'

module.exports = Base

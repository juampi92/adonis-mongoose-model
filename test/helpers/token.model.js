const TokenMongoose = require('../../src/Model/TokenMongoose')

/**
 * Token's instance and static methods
 * @class
 */
class Token extends TokenMongoose {
  /**
   * You can modify the amount of days that the token will be valid
   */
  static expires () {
    return 5
  }

  /**
   * You can modify the default schema
   */
  static get schema () {
    // Edit your schema here
    return super.schema
  }

  /**
   * Customize populated properties for the user
   */
  static getUserFields (type) {
    return '_id email'
  }
}

module.exports = Token.buildModel('Token')

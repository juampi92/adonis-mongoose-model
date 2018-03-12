const Base = require('../../src/Model/Base')

class User extends Base {
  /**
   * You can modify the amount of days that the token will be valid
   */
  static schema () {
    return {
      email: String,
      name: String,
      password: String
    }
  }
}

module.exports = User.buildModel('User')

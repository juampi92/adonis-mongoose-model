/* global use */
'use strict'

const Model = require('./Base')

const { ObjectId } = use('mongoose').Schema.Types

const utils = require('../utils')

/**
 * Token's instance and static methods
 * @class
 */
class Token extends Model {
  /**
   * Make the token an index on the boot method
   *
   * @static
   */
  static boot() {
    // Create a token index
    this.index({ token: 1 })
  }

  /**
   * Disable timestamps for the Token Model
   *
   * @readonly
   * @static
   */
  static get timestamps() {
    return false
  }

  /**
   * Defines the amount of days
   *
   * @static
   * @returns {Numeric}
   */
  static expires() {
    return 5
  }

  /**
   * Define User's schema internally using Model's schema property
   */
  static get schema() {
    return {
      uid: { type: ObjectId, ref: 'User' },
      token: { type: String, required: true },
      type: { type: String, required: true },
      expires: { type: Date, default: () => utils.nowAddDays(this.expires()) }
    }
  }

  /**
   * Customize the fields populated by the user.
   * Return string of fields separated by a space
   *
   * Read Query field selection: http://mongoosejs.com/docs/api.html#query_Query-select
   *
   * @static
   * @param {String} type
   * @returns {String}
   */
  static getUserFields(type) {
    return null
  }

  /**
   * Fetches session that matches that token, with the populated user
   *
   * @static
   * @param {String} token
   * @param {String} type
   * @returns {Object} returns the token object with the populated user
   */
  static async fetchSession(token, type) {
    return this
      .findOneAndUpdate({
        token,
        type,
        expires: {
          $gte: new Date()
        }
      }, {
          expires: utils.nowAddDays(this.expires())
        })
      .populate('uid', this.getUserFields(type))
  }

  /**
   * Remove sessions that match that token
   *
   * @static
   * @param {any} token
   * @returns
   */
  static async dispose(uid, tokens = null, inverse = false) {
    // Remove some tokens
    if (tokens) {
      // Remove all but selected, or just selected
      const selector = inverse ? '$nin' : '$in';
      let query = {
        token: { [selector]: tokens }
      };
      return this.remove(query).exec()
    }
    // Remove all tokens
    return this.remove({
      uid
    }).exec()
  }
}

module.exports = Token

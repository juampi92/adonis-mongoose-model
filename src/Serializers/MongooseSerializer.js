'use strict'

const { ioc } = require('@adonisjs/fold')
const debug = require('debug')('adonis:auth')

/**
 * Mongoose serializers uses mogoose model to validate
 * and fetch user details.
 *
 * @class MongooseSerializer
 * @constructor
 */
class MongooseSerializer {
  constructor (Hash) {
    this.Hash = Hash
    this._config = null
  }

  /* istanbul ignore next */
  /**
   * Dependencies to be injected by Ioc container
   *
   * @attribute inject
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Hash']
  }

  /**
   * Setup config on the serializer instance. It
   * is import and needs to be done as the
   * first step before using the serializer.
   *
   * @method setConfig
   *
   * @param  {Object}  config
   */
  setConfig (config) {
    this._config = config
    this._Model = ioc.make(config.model)
    this._Token = ioc.make(config.token)
  }

  /**
   * Returns the primary key for the
   * model. It is used to set the
   * session key
   *
   * @method primaryKey
   *
   * @return {String}
   */
  get primaryKey () {
    return this._Model.primaryKey
  }

  /**
   * Add runtime constraints to the query builder. It
   * is helpful when auth has extra constraints too
   *
   * @method query
   *
   * @param  {Function} callback
   *
   * @chainable
   */
  query (callback) {
    this._queryCallback = callback
    return this
  }

  /**
   * Returns a user instance using the primary
   * key
   *
   * @method findById
   *
   * @param  {Number|String} id
   *
   * @return {User|Null}  The model instance or `null`
   */
  async findById (id) {
    debug('finding user with primary key as %s', id)
    return this._Model
      .findById(id)
      .exec()
  }

  /**
   * Finds a user using the uid field
   *
   * @method findByUid
   *
   * @param  {String}  uid
   *
   * @return {Model|Null} The model instance or `null`
   */
  async findByUid (uid) {
    return this._Model
      .findOne({
        [this._config.uid || this.primaryKey]: uid
      })
  }

  /**
   * Validates the password field on the user model instance
   *
   * @method validateCredentails
   *
   * @param  {Model}            user
   * @param  {String}            password
   *
   * @return {Boolean}
   */
  async validateCredentails (user, password) {
    const pw = user[this._config.password]
    if (!user || !pw) {
      return false
    }
    return this.Hash.verify(password, pw)
  }

  /**
   * Finds a user with token
   *
   * @method findByToken
   *
   * @param  {String}    token
   * @param  {String}    type
   *
   * @return {Object|Null}
   */
  async findByToken (token, type) {
    debug('finding user for %s token', token)
    if (!token) return null

    const tokenResponse = await this._Token.fetchSession(token, type)

    if (!tokenResponse) return null

    const { uid } = tokenResponse
    return uid // this.findById(uid)
  }

  /**
   * Save token for a user. Tokens are usually secondary
   * way to login a user when their primary login is
   * expired
   *
   * @method saveToken
   *
   * @param  {Object}  user
   * @param  {String}  token
   * @param  {String}  type
   *
   * @return {void}
   */
  async saveToken (user, token, type) {
    let accessToken = new this._Token({
      token, uid: user._id, type
    })
    debug('saving token for %s user', user._id)
    await accessToken.save()
  }

  /**
   * Revoke token(s) or all tokens for a given user
   *
   * @method revokeTokens
   *
   * @param  {Object}           user
   * @param  {Array|String}     [tokens = null]
   * @param  {Boolean}          [inverse = false]
   *
   * @return {Number}           Number of impacted rows
   */
  async revokeTokens (user, tokens = null, inverse = false) {
    return this.deleteTokens(user, tokens, inverse)
  }

  /**
   * Delete token(s) or all tokens for a given user
   *
   * @method deleteTokens
   *
   * @param  {Object}           user
   * @param  {Array|String}     [tokens = null]
   * @param  {Boolean}          [inverse = false]
   *
   * @return {Number}           Number of impacted rows
   */
  async deleteTokens (user, tokens = null, inverse = false) {
    if (tokens) {
      debug('revoking %j tokens for %s user', tokens, user.primaryKeyValue)
    } else {
      debug('revoking all tokens for %s user', user.primaryKeyValue)
    }
    return this._Token.dispose(user.primaryKeyValue, tokens, inverse)
  }

  /**
   * Returns all non-revoked list of tokens for a given user.
   *
   * @method listTokens
   * @async
   *
   * @param  {Object}   user
   * @param  {String}   type
   *
   * @return {Object}
   */
  async listTokens (user, type) {
    return this._Token.find({
      uid: user.primaryKeyValue, type
    }).exec()
  }

  /**
   * A fake instance of serializer with empty set
   * of array
   *
   * @method fakeResult
   *
   * @return {Object}
   */
  fakeResult () {
    return new this._Model.Serializer([])
  }
}

module.exports = MongooseSerializer

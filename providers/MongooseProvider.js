'use strict'

/*
 * adonis-mongoose-model
 *
 * (c) Juan Pablo Barreto <juampi92@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc, ServiceProvider }  = require('@adonisjs/fold')
const Mongoose = require('mongoose')

class MongooseProvider extends ServiceProvider {

  /**
   * Install mongoose serializer
   */
  _registerSerializer () {
    ioc.extend('Adonis/Src/Auth',
      'mongoose',
      (app) => require('../src/Serializers/MongooseSerializer'),
      'serializer')
  }

  async _registerMongoose () {
    this.app.singleton('Adonis/Addons/Mongoose', function (app) {
      const Config = app.use('Adonis/Src/Config')
      let connectionString = Config.get('database.mongodb.connectionString', null)
      const {
        host = 'localhost',
        port = 27017,
        database = 'test',
        user = null,
        pass = null,
        options = {},
        debug = false
      } = Config.get('database.mongodb.connection')

      const auth = user ? `${user}:${pass}@` : ''

      if (!connectionString) {
        connectionString = `mongodb://${auth}${host}:${port}/${database}`
      }

      Mongoose.Promise = global.Promise
      Mongoose.connect(connectionString, {
        useMongoClient: true,
        ...options
      })

      if (debug) {
        Mongoose.set('debug', true)
      }

      return Mongoose
    })
  }

  _registerModel () {
    this.app.bind('Adonis/Src/Model', (app) => require('../src/Model/Base'))
    this.app.bind('AdonisMongoose/Src/Token', (app) => require('../src/Model/TokenMongoose'))
    this.app.alias('Adonis/Src/Model', 'Model')
  }

    /**
   * Register the `make:Mongoose` command to the IoC container
   *
   * @method _registerCommands
   *
   * @return {void}
   *
   * @private
   */
  _registerCommands () {
    this.app.bind('Adonis/Commands/Make:Mongoose', () => require('../commands/MakeModel'))
  }

  /**
   * Register bindings
   *
   * @method register
   *
   * @return {void}
   */
  async register () {
    this._registerSerializer()
    this._registerModel()
    this._registerCommands()
    await this._registerMongoose()
  }

  /**
   * On boot
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    /**
     * Register command with ace.
     */
    const ace = require('@adonisjs/ace')
    ace.addCommand('Adonis/Commands/Make:Mongoose')
  }

}

module.exports = MongooseProvider

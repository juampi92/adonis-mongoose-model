'use strict'

const { ioc, ServiceProvider }  = require('@adonisjs/fold')
const Mongoose = require('mongoose')

const MongooseSerializer = require('../src/Serializers/MongooseSerializer')


class MongooseProvider extends ServiceProvider {

  /**
   * Install mongoose serializer
   */
  _registerSerializer() {
    ioc.extend('Adonis/Src/Auth', 'mongoose', function (app) {
      return MongooseSerializer
    }, 'serializer')
  }

  async _registerMongoose() {
    this.app.singleton('Adonis/Addons/Mongoose', function (app) {
      const Config = app.use('Adonis/Src/Config')
      const { host, port, database, user, pass } = Config.get('database.mongodb.connection')

      const connectUri = `mongodb://${host}:${port}/${database}`
      const connectionString = (user || pass) ? `${user}:${pass}@${connectUri}` : connectUri
      Mongoose.Promise = global.Promise
      Mongoose.connect(connectionString, {
        useMongoClient: true
      })

      return Mongoose
    })
  }

  _registerModel() {
    this.app.bind('Adonis/Src/Model', (app) => require('../src/Model/Base'))
    this.app.alias('Adonis/Src/Model', 'Model')
  }

  async register () {
    this._registerSerializer()
    this._registerModel()
    await this._registerMongoose()
  }

}

module.exports = MongooseProvider

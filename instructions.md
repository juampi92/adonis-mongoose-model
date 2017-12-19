## Register provider

Make sure to register the provider inside `start/app.js` file.

```js
const providers = [
  'adonis-mongoose/providers/MongooseProvider',
]
```

And create an Alias for Mongoose

```js
const aliases = {
  Mongoose: 'Adonis/Addons/Mongoose'
}
```
## Config mongodb connection

Make sure to add the database config inside `config/database.js` file.

```js
  /*
  |--------------------------------------------------------------------------
  | MongoDB
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for MongoDB database.
  |
  */
  mongodb: {
    connection: {
      host: Env.get('MONGO_HOST', 'localhost'),
      port: Env.get('MONGO_PORT', 27017),
      username: Env.get('MONGO_USER', 'admin'),
      password: Env.get('MONGO_PASSWORD', ''),
      database: Env.get('MONGO_DATABASE', 'adonis'),
    }
  },
```

And then your `.env` file

```bash
  DB_CONNECTION=mongodb
  MONGO_HOST=127.0.0.1
  MONGO_PORT=27017
  MONGO_USER=
  MONGO_PASSWORD=
  MONGO_DATABASE=prap
```

That's all 🎉


## Configuring Auth serializer

Edit the `config/auth.js` file for including the serializer. For example on the api schema

```js
  api: {
    serializer: 'mongoose',
    scheme: 'api',
    model: 'App/Models/User',
    token: 'App/Models/Token',
    uid: 'username', // The user identifier. Ej: email, username
    password: '', // Password field if using user-password validation
    expiry: '30d', // Not yet implemented
  },
```

There's an example of a mongoose Token Model below, that will match with the serializer perfectly.
(this needs more work)


## Creating Models

```js
'use strict'

const mongoose = use('Mongoose')
const { Schema } = mongoose
const Model = use('Model') // Basic Mongoose Model

/**
 * User's db Schema
 */
const UserSchema = new Schema({
  name: String
})

/**
 * User's instance and static methods
 * @class
 */
class User extends Model {

}

UserSchema.loadClass(User)

module.exports = mongoose.model('User', UserSchema)

```

# Token model

This is an example of a Token Model compatible with the Mongoose Serializer

```js
  'use strict'

  const mongoose = use('Mongoose')
  const { Schema } = mongoose
  const Model = use('Model')

  const moment = use('moment')

  /**
   * Token's db Schema
   */
  const TokenSchema = new Schema({
    uid:          { type: Schema.Types.ObjectId, ref: 'User' },
    token:        { type: String, required: true },
    type:         { type: String, required: true },
    expires:      { type: Date, default: () => moment().add(5, 'days') }
  })

  /**
   * Token's instance and static methods
   * @class
   */
  class Token extends Model {
    /**
     *
     *
     * @static
     * @param {String} token
     * @param {String} type
     * @memberof Token
     */
    static async fetchSession(token, type) {
      return await this.findOneAndUpdate({
        token,
        type,
        expires: {
          $gte: moment()
        }
      }, {
        expires: moment().add(5, 'days')
      }).populate('uid', '_id name').exec()
    }

    /**
     * Remove sessions that match that token
     *
     * @static
     * @param {any} token
     * @returns
     * @memberof Token
     */
    static async dispose(uid, tokens = null, inverse = false) {
      // Remove some tokens
      if (tokens) {
        // Remove all but selected, or just selected
        const selector = inverse ? '$nin' : '$in'
        return this.remove({
          uid,
          [selector]: tokens
        }).exec()
      }
      // Remove all tokens
      return this.remove({
        uid
      }).exec()
    }
  }

  TokenSchema.loadClass(Token)
  TokenSchema.index({ token: 1 });

  module.exports = mongoose.model('Token', TokenSchema)
```

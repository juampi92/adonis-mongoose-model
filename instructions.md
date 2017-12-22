## Register provider

Make sure to register the provider inside `start/app.js` file.

```js
const providers = [
  'adonis-mongoose-model/providers/MongooseProvider',
]
```

And create an Alias for Mongoose

```js
const aliases = {
  Mongoose: 'Adonis/Addons/Mongoose'
}
```
## Config mongodb connection

Finally add the database config inside `config/database.js` file.

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
    connectionString: Env.get('MONGO_CONNECTION_STRING', null),
    connection: {
      host: Env.get('MONGO_HOST', 'localhost'),
      port: Env.get('MONGO_PORT', 27017),
      user: Env.get('MONGO_USER', 'admin'),
      pass: Env.get('MONGO_PASSWORD', ''),
      database: Env.get('MONGO_DATABASE', 'adonis'),
      options: {
        // All options can be found at http://mongoosejs.com/docs/connections.html
      }
    }
  },
```

And then your `.env` file

```bash
  DB_CONNECTION=mongodb
  MONGO_HOST=127.0.0.1
  MONGO_PORT=27017
  MONGO_USER=user
  MONGO_PASSWORD=pwsecret123
  MONGO_DATABASE=adonis
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

Also, when defining your User Model, you'll have to add this static property to your schema, in order for the Auth Schemas to work. (They'll access the static property 'primaryKey' of the model)

```js
UserSchema.statics.primaryKey = '_id'
```


## Creating Models

You can initiate a model using adonis cli,

```bash
adonis make:mongoose Foo
```

And that will make the following

```js
'use strict'

const mongoose = use('Mongoose')
const { Schema } = mongoose
const Model = use('Model') // Basic Mongoose Model

/**
 * Foo's db Schema
 */
const FooSchema = new Schema({
  
})

/**
 * Foo's instance and static methods
 * @class
 */
class Foo extends Model {
  
}

FooSchema.loadClass(Foo)

module.exports = mongoose.model('Foo', FooSchema)

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
      return this.findOneAndUpdate({
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

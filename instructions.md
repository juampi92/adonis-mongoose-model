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

# Config mongodb connection

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
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', 27017),
      username: Env.get('DB_USER', 'admin'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis'),
    }
  },
```

That's all 🎉

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

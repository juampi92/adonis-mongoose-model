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
      },
      debug: false
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


## Creating Models

You can initiate a model using adonis cli,

```bash
adonis make:mongoose Foo
```

And that will make the following

```js
'use strict'

const BaseModel = use('Model')

/**
 * @class Foo
 */
class Foo extends BaseModel {
  static boot () {
    // Hooks:
    // this.addHook('preSave', () => {})
    // Indexes:
    // this.index({}, {background: true})
  }
  /**
   * Foo's schema
   */
  static get schema () {
    return {

    }
  }
}

module.exports = Foo.buildModel('Foo')

```

## Defining Schema

You define your schema by overwriting the `static get schema ()`.

## Create indexes

Indexes can be created inside the `static boot ()` function (using the same syntax as mongoose's) or outside the class declaration. In that case the index will be deferred until the schema is built when running `buildModel`

## Using hooks

As you might know, Adonis comes with a tool called `hook`, which you can create using `adonis make:hook User`. That'll create a Hook for the User model so you can attach middleware straight to that.
Now with mongoose-model, you can attach a middleware to a model. [Adonis hook documentation](https://adonisjs.com/docs/4.0/database-hooks) - [Mongoose middleware documentation](http://mongoosejs.com/docs/middleware.html)

Inside the boot function, you can

```js
static boot () {
  this.addHook('preSave', 'UserHook.notifyUpdate')
}
```

Having in `App/Models/Hooks/UserHook.js`:

```js
UserHook.notifyUpdate = async (modelInstance) => {
  // Use await if you'd like to make this async
  NotificationCenter.push(modelInstance._id, 'save')
}
```

The addHook functionality doesn't necesarely needs a hook. You can use a callback (the mongoose's middleware doc), and the name of the hook is composed by [pre | post] [Init | Save | Remove | Validate]. It's important that the command is written in CamelCase.

## Using timestamps

As default, adonis-mongoose-model comes with the created_at and updated_at property, that comes with a middleware that updates the updated_at prop each time you save.

You can ignore those properties by adding a static property on your model:

```js
static get timestamps () {
  return false
}
```

## Extra: accessing the raw schema

Inside the boot function you can do `this._schema` and access the raw mongoose schema, and add all kinds of custom functionality.
If you are thingking that this package is mising something, create a PR! They are more than welcome.

# Token model

This is an example of a Token Model compatible with the Mongoose Serializer

```js
'use strict'

const Model = use('Model')

const { ObjectId } = use('Mongoose').Schema.Types

const moment = use('moment')

/**
 * Token's instance and static methods
 * @class
 */
class Token extends Model {
  static get timestamps () {
    return false
  }

  /**
   * Define User's schema internally using Model's schema property
   */
  static get schema () {
    return {
      uid:          { type: ObjectId, ref: 'User' },
      token:        { type: String, required: true },
      type:         { type: String, required: true },
      expires:      { type: Date, default: () => moment().add(5, 'days') }
    }
  }

  /**
   *
   *
   * @static
   * @param {String} token
   * @param {String} type
   * @memberof Token
   */
  static async fetchSession (token, type) {
    return this.findOneAndUpdate({
      token,
      type,
      expires: {
        $gte: moment()
      }
    }, {
      expires: moment().add(5, 'days')
    })
    .populate('uid')
  }

  /**
   * Remove sessions that match that token
   *
   * @static
   * @param {any} token
   * @returns
   * @memberof Token
   */
  static async dispose (uid, tokens = null, inverse = false) {
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

Token.index({ token: 1 })

module.exports = Token.buildModel('Token')
```

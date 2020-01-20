## Register provider

Make sure to register the provider inside `start/app.js` file.

```js
const providers = [
  'adonis-mongoose-model/providers/MongooseProvider',
]
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

const BaseModel = use('MongooseModel')

/**
 * @class Foo
 */
class Foo extends BaseModel {
  static boot ({ schema }) {
    // Hooks:
    // this.addHook('preSave', () => {})
    // Indexes:
    // this.index({}, {background: true})
    // Virtuals, etc:
    // schema.virtual('something').get(.......)
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

Indexes can be created inside the `static boot ({ schema })` function (using the same syntax as mongoose's) or outside the class declaration. In that case the index will be deferred until the schema is built when running `buildModel`

## Using hooks

As you might know, Adonis comes with a tool called `hook`, which you can create using `adonis make:hook User`. That'll create a Hook for the User model so you can attach middleware straight to that.
Now with mongoose-model, you can attach a middleware to a model. [Adonis hook documentation](https://adonisjs.com/docs/4.0/database-hooks) - [Mongoose middleware documentation](http://mongoosejs.com/docs/middleware.html)

Inside the boot function, you can

```js
static boot ({ schema }) {
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

## Using traits

Traits work exactly the same way they do in Adonisjs, please refer to the official [Adonis traits documentation](https://adonisjs.com/docs/4.1/traits). Traits are initialized in the boot method:

```
  static boot ({ schema }) {
    this.addTrait('App/Models/Traits/HasMedia', { // trait options })
  }
```

It's worth noting that everty trait has access to the schema property on the model, accessible through the `Model._schema()` property. This enabled us to alter the schema from the trait.

```
class HasMedia {
  register (Model, customOptions = {}) {
    const defaultOptions = {}
    const options = Object.assign(defaultOptions, customOptions)
    
     // add a new field to the schema
    Model._schema.add({ my_media: String })
      
    Model.prototype.testFunction = async function(){
      console.log("this function will be available from the model")
    }
```

## Using timestamps

As default, adonis-mongoose-model comes with the created_at and updated_at property, that comes with a middleware that updates the updated_at prop each time you save.

You can ignore those properties by adding a static property on your model:

```js
static get timestamps () {
  return false
}
```

## Extra: accessing the raw schema

Inside the boot function you can take advantage of the `{ schema }` passed as parameter and access the raw mongoose schema, and add all kinds of custom functionality.
If you are thingking that this package is mising something, create a PR! They are more than welcome.
Also, when calling `buildSchema()`, it returns the schema that you can now modify

# Token model

When using auth, you'll need to define a Token Model. You do that on the `config/auth.js` file, under the `token: ''` property.

You'll have to create a model `App/Models/Token` and extend the mongoose token-model it like this:

```js
'use strict'

const TokenMongoose = use('AdonisMongoose/Src/Token')

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
```

Check the full source of the Token Model here: [src/Model/TokenMongoose.js](src/Model/TokenMongoose.js)

# Advanced Usage

## new Schema options

If you wanna add the custom schema options when initializing, you can override the static property `static get schemaOptions ()` and return the object with the custom options.
Also on `static boot ()` you have access to the schema by doing `this._schema`, so you can set properties like `this._schema.set(option, value)`

## Life Cycle

The `BaseModel` has a pretty simple lifecycle.

When you call `buildModel('Modelname')`, this steps occur:

- The Schema is built (if you havent built it already), using the static property `static get schema()` and with the options from the `static get schemaOptions ()`.

- Now we have the schema, so the next step uses mongoose's `schema.loadClass(this)`. This way every method is inherited on the Model.

- Then the indexes are created (only if you've specified before the buildModel)

- Then the `boot()` function is triggered, so if you'd like to add custom creation behaviour (like adding hooks or indexes) you can, overwritting this empty static method.

- Then the model is created, using `mongoose.model(name, this._schema)` and returned for you to export.

## About the primaryKey

Auth Serializers and Schemes need the model to have a 'primaryKey' property, so they can have the unique identifier of the model. The primaryKey of Mongoose-Model is 'id', which corresponds with [this](http://mongoosejs.com/docs/api.html#document_Document-id). If you'd like to change it, overwrite the property on your model.

```js
static get primaryKey () {
  return 'id'
}
```

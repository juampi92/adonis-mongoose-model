'use strict'

const test = require('japa')
const { ioc } = require('@adonisjs/fold')

test.group('Model', function () {
  ioc.fake('Mongoose', () => require('mongoose'))
  ioc.fake('MongooseModel', () => require('../src/Model/Base'))

  const Model = use('MongooseModel')

  test('should throw error if schema is not defined', function (assert) {
    assert.throws(() => {
      Model.buildSchema()
    }, 'You must override the static get schema() property')
  })

  test('should instanciate the schema', function (assert) {
    class NewModel extends Model {
      static get schema () {
        return {
          name: { type: String, default: 'asd' }
        }
      }
    }

    const schema = NewModel.buildSchema()

    assert.deepEqual(schema, NewModel._schema)

    const M = NewModel.buildModel('M')

    assert.equal((new M()).name, 'asd')
    assert.equal((new M({ name: '1' })).name, '1')
  })

  test('should define primary key', function (assert) {
    class NewModel extends Model {
      static get primaryKey () {
        return 'num'
      }

      static get schema () {
        return {
          name: String,
          num: Number
        }
      }
    }

    const ME = NewModel.buildModel('ME')
    const model = (new ME({ num: 21 }))

    assert.equal(model.primaryKey, 'num')
    assert.equal(model.primaryKeyValue, 21)
  })

  test('should define indexes', function (assert) {
    class NewModel extends Model {
      static boot ({ schema }) {
        this.index({ name: 1 })
      }

      static get schema () {
        return {
          name: String,
          num: Number
        }
      }
    }

    NewModel.index({ num: 1 }, { background: false })

    NewModel.buildModel('M3')

    const indexes = NewModel._schema._indexes

    assert.lengthOf(indexes, 2)
    assert.deepEqual(indexes[0], [{ num: 1 }, { background: false }])
    assert.deepEqual(indexes[1], [{ name: 1 }, { background: true }])
  })

  test('should define timestamps', function (assert) {
    class NewModelTimeless extends Model {
      static get timestamps () {
        return false
      }

      static get schema () {
        return {
          name: String,
          num: Number
        }
      }
    }

    class NewModel extends Model {
      static get schema () {
        return {
          name: String,
          num: Number
        }
      }
    }

    NewModelTimeless.buildModel('M4-T')
    NewModel.buildModel('M4')

    assert.hasAnyKeys(NewModel._schema.options, ['timestamps'])
    assert.hasAllKeys(NewModel._schema.options.timestamps, ['createdAt', 'updatedAt'])
    assert.doesNotHaveAnyKeys(NewModelTimeless._schema.options, ['timestamps'])
  })

  test('should create hooks', function (assert, done) {
    assert.plan(1)

    class NewModel extends Model {
      static boot ({ schema }) {
        this.addHook('preValidate', function (next) {
          assert.equal(this.num, 5)
          next()
          done()
        })
      }

      static get schema () {
        return { name: { type: String, required: true }, num: Number }
      }
    }

    const M5 = NewModel.buildModel('M5')

    const m = new M5({ name: 'asd', num: 5 })
    m.validate()
  })

  test('should link file hooks', function (assert, done) {
    assert.plan(1)

    ioc.fake('App/Models/Hooks/FakeHook', () => {
      return {
        method: async (modelInstance) => {
          // Use await if you'd like to make this async
          // do something?
          assert.equal(modelInstance.num, 1)
          done()
        }
      }
    })

    class NewModel extends Model {
      static boot ({ schema }) {
        this.addHook('preValidate', 'FakeHook.method')
      }

      static get schema () {
        return { name: { type: String, required: true }, num: Number }
      }
    }

    const M6 = NewModel.buildModel('M6')

    const m = new M6({ name: 'asd', num: 1 })
    m.validate()
  })
})

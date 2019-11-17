'use strict'

const test = require('japa')
const utils = require('../src/utils')

test.group('Hooks', function () {
  test('should separate correctly to mongoose', function (assert) {
    const events = {
      preSave: { instruction: 'pre', command: 'save' },
      postSave: { instruction: 'post', command: 'save' },
      preFind: { instruction: 'pre', command: 'find' }
    }

    Object.keys(events).forEach(key => {
      assert.deepEqual(utils.formatToMongooseMiddleware(key), events[key])
    })
  })

  test('should throw error when invalid', function (assert) {
    assert.throws(() => utils.formatToMongooseMiddleware('preSaved'),
      'saved is not a valid mongoose command when using preSaved. Check the middleware docs: http://mongoosejs.com/docs/middleware.html')

    assert.throws(() => utils.formatToMongooseMiddleware('presSaved'),
      'pres is not a valid mongoose command when using presSaved. Check the middleware docs: http://mongoosejs.com/docs/middleware.html')
  })

  test('should transform from lucid hook', function (assert) {
    const events = {
      beforeSave: { instruction: 'pre', command: 'save' },
      afterSave: { instruction: 'post', command: 'save' },
      preDelete: { instruction: 'pre', command: 'remove' }
    }

    Object.keys(events).forEach(key => {
      assert.deepEqual(utils.formatToMongooseMiddleware(key), events[key])
    })
  })
})

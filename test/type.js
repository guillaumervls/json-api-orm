var test = require('tape');

var orm = require('..');

module.exports.run = function () {

  var item = orm.registerType({
    table: 'item',
    collection: 'items',
    fields: {
      a: {
        required: true,
      },
      b: {
        defaults: 'default_b',
        hidden: function (req, cb) {
          cb(null, true);
        }
      },
      c: {
        defaults: function (req, cb) {
          cb(null, 'default_c');
        }
      },
      d: {
        validate: /x/i
      },
      e: {
        validate: function (req, value, cb) {
          if (value.length !== this.a) {
            return cb(new Error('Custom error message (error in e field validation)'));
          }
          cb();
        }
      },
      f: {
        serialize: function (value) {
          return value.getYear();
        },
        hidden: true
      },
      g: {
        collection: 'otheritems'
      },
      h: {
        subUrl: 'things'
      }
    }
  });

  test('instance creation - remove keys unpecified in keys', function (t) {
    t.plan(3);
    item.create(null, {
      a: 'hello',
      otherKey: 'world'
    }, function (err, instance) {
      t.error(err, 'no error');
      t.is(instance.a, 'hello', 'kept the key');
      t.is(instance.otherKey, undefined, 'removed the key');
    });
  });

  test('instance creation - fail if missing required field', function (t) {
    t.plan(1);
    item.create(null, {
      b: 1
    }, function (err) {
      t.true(err, 'failed correctly : ' + err.message);
    });
  });

  test('instance creation - defaults', function (t) {
    t.plan(2);
    item.create(null, {
      a: 1
    }, function (err, instance) {
      t.is(instance.b, 'default_b', 'default passed explicitly');
      t.is(instance.c, 'default_c', 'default passed as a function');
    });
  });

  test('instance creation - validation', function (t) {
    t.plan(2);
    item.create(null, {
      a: 1,
      d: 'y'
    }, function (err) {
      t.true(err, 'with regex failed correctly : ' + err.message);
    });
    item.create(null, {
      a: 1,
      e: 'zz'
    }, function (err) {
      t.true(err, 'with function failed correctly : ' + err.message);
    });
  });

  test('instance serialization', function (t) {
    t.plan(2);
    item.create(null, {
      a: 1,
      b: {}
    }, function (err, instance) {
      t.throws(function () {
        item.serialize(instance);
      }, 'not having an allowedDBType throws an exception');
    });
    item.create(null, {
      a: 1,
      f: new Date(0)
    }, function (err, instance) {
      t.is(item.serialize(instance).f, 70, 'serialization went well');
    });
  });

  test('instance output formatting', function (t) {
    t.plan(2);
    item.create(null, {
      a: 1,
      b: 'hello'
    }, function (err, instance) {
      item.outputFormat(null, instance, function (err, formattedInstance) {
        t.is(formattedInstance.b, undefined, 'removed the hidden key - specified by function');
      });
    });
    item.create(null, {
      a: 1,
      f: new Date(0)
    }, function (err, instance) {
      item.outputFormat(null, instance, function (err, formattedInstance) {
        t.is(formattedInstance.f, undefined, 'removed the hidden key - specified directly');
      });
    });
  });

  test('link object creation', function (t) {
    t.plan(1);
    t.deepEquals(item.links, {
      'items.g': {
        'href': '/api/otheritems/{items.g}',
        'type': 'otheritems'
      },
      'items.h': {
        'href': '/api/items/{items.id}/things',
      }
    });
  });
};
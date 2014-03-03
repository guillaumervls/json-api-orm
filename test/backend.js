var test = require('tape');

var orm = require('..');

module.exports.run = function () {
  test('orm level create/read/update/delete', function (t) {
    t.plan(4);

    orm.create(new orm.Type(), {
      id: 'id'
    }, function (err, result) {
      t.deepEquals(result, {
        query: 'create',
        object: {
          id: 'id'
        }
      }, 'created');
    });

    orm.read(new orm.Type(), ['id'], function (err, result) {
      t.deepEquals(result, {
        query: 'read',
        ids: ['id']
      }, 'read');
    });

    orm.update(new orm.Type(), {
      attr: 'attr'
    }, function (err, result) {
      t.deepEquals(result, {
        query: 'update',
        patch: {
          attr: 'attr'
        }
      }, 'updated');
    });

    orm.delete(new orm.Type(), 'id', function (err, result) {
      t.deepEquals(result, {
        query: 'delete',
        id: 'id'
      }, 'deleted');
    });
  });
};
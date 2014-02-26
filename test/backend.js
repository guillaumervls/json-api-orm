var test = require('tape');

var orm = require('../lib/main');

module.exports.run = function () {
  test('orm level create/read/update/delete', function (t) {
    t.plan(4);

    orm.create('type', [{
      id: 'id'
    }], function (err, result) {
      t.deepEquals(result, {
        query: 'create',
        type: 'type',
        objects: [{
          id: 'id'
        }]
      });
    });

    orm.read('type', ['id'], function (err, result) {
      t.deepEquals(result, {
        query: 'read',
        type: 'type',
        ids: ['id']
      });
    });

    orm.update('type', [{
      attr: 'attr'
    }], function (err, result) {
      t.deepEquals(result, {
        query: 'update',
        type: 'type',
        patches: [{
          attr: 'attr'
        }]
      });
    });

    orm.delete('type', ['id'], function (err, result) {
      t.deepEquals(result, {
        query: 'delete',
        type: 'type',
        ids: ['id']
      });
    });
  });
};
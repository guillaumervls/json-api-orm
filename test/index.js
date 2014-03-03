var backend = require('./backend');
var type = require('./type');

require('..').
settings({
  mountPoint: '/api'
}).
// Mock backend
// --------------------------------------
setupBackend({
  queryCreate: function (object) {
    return {
      query: 'create',
      object: object
    };
  },
  queryRead: function (ids) {
    return {
      query: 'read',
      ids: ids
    };
  },
  queryUpdate: function (patch) {
    return {
      query: 'update',
      patch: patch
    };
  },
  queryDelete: function (id) {
    return {
      query: 'delete',
      id: id
    };
  },
  exec: function (query, callback) {
    callback(null, query);
  }
});

backend.run();
type.run();
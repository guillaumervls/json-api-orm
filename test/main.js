var backend = require('./backend');

// Mock backend
require('../lib/main').setupBackend({
  queryCreate: function (type, objects) {
    return {
      query: 'create',
      type: type,
      objects: objects
    };
  },
  queryRead: function (type, ids) {
    return {
      query: 'read',
      type: type,
      ids: ids
    };
  },
  queryUpdate: function (type, patches) {
    return {
      query: 'update',
      type: type,
      patches: patches
    };
  },
  queryDelete: function (type, ids) {
    return {
      query: 'delete',
      type: type,
      ids: ids
    };
  },
  exec: function (query, callback) {
    callback(null, query);
  }
});

backend.run();
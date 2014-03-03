var _ = require('lodash');
var Type = require('./type');

var backendDefaults = {
  queryCreate: function () {},
  queryRead: function () {},
  queryUpdate: function () {},
  queryDelete: function () {},
  exec: function () {},
  allowedDBTypes: ['string', 'number', 'boolean']
};

var orm = module.exports;

// DEFAULTS
// ----------------------------
orm.mountPoint = '';
orm.primaryKeyName = 'id';
orm.typesByCollection = {};
orm.typesByTable = {};
_.assign(orm, backendDefaults);
// ----------------------------

_.assign(orm, {
  registerType: function (description) {
    var type = new Type(description);
    orm.typesByCollection[description.collection] = type;
    orm.typesByTable[description.table] = type;
    return type;
  },
  setupBackend: function (backend) {
    _.assign(orm, backend);
    return orm;
  },
  settings : function (settings) {
    _.assign(orm, settings);
    return orm;
  },
  create: function (type, object, cb) {
    try {
      this.exec(this.queryCreate.call(type, object), cb);
    } catch (e) {
      cb(e);
    }
  }.bind(orm),
  read: function (type, ids, cb) {
    try {
      this.exec(type.getRelated(this.queryRead.call(type, ids)), cb);
    } catch (e) {
      cb(e);
    }
  }.bind(orm),
  update: function (type, patch, cb) {
    try {
      this.exec(this.queryUpdate.call(type, patch), cb);
    } catch (e) {
      cb(e);
    }
  }.bind(orm),
  delete: function (type, id, cb) {
    try {
      this.exec(this.queryDelete.call(type, id), cb);
    } catch (e) {
      cb(e);
    }
  }.bind(orm)
});
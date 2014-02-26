var _backend = {
  queryCreate: function () {},
  queryRead: function () {},
  queryUpdate: function () {},
  queryDelete: function () {},
  exec: function () {}
};

var e = module.exports;

e.setupBackend = function (backend) {
  _backend = backend;
};

e.create = function (type, objects, cb) {
  try {
    _backend.exec(_backend.queryCreate(type, objects), cb);
  } catch (e) {
    cb(e);
  }
};
e.read = function (type, ids, cb) {
  try {
    _backend.exec(_backend.queryRead(type, ids), cb);
  } catch (e) {
    cb(e);
  }
};
e.update = function (type, patches, cb) {
  try {
    _backend.exec(_backend.queryUpdate(type, patches), cb);
  } catch (e) {
    cb(e);
  }
};
e.delete = function (type, ids, cb) {
  try {
    _backend.exec(_backend.queryDelete(type, ids), cb);
  } catch (e) {
    cb(e);
  }
};
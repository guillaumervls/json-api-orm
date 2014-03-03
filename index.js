var orm = require('./lib/orm');
var Type = require('./lib/type');

Type.prototype.orm = orm;
orm.Type = Type;

module.exports = orm;
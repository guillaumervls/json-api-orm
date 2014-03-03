var _ = require('lodash');
var when = require('when');
var ClientError = require('client-error');
var keys = require('when/keys');
var nodefn = require('when/node/function');

var Type = module.exports = function (description) {
  _.assign(this, _.pick(description,
    'table',
    'collection',
    'fields',
    'hooks',
    'query',
    'getRelated'
  ));
  this.getRelated = this.getRelated || _.identity;
  this.links = {};
  this.fields = _.mapValues(this.fields, function (field, name) {
    if (field.collection) {
      this.links[this.collection + '.' + name] = {
        href: this.orm.mountPoint + '/' + field.collection + '/{' + this.collection + '.' + name + '}',
        type: field.collection
      };
    }
    if (field.subUrl) {
      this.links[this.collection + '.' + name] = {
        href: this.orm.mountPoint + '/' + this.collection + '/{' + this.collection + '.' + this.orm.primaryKeyName + '}/' + field.subUrl,
      };
    }
    return _.defaults(_.pick(field,
      'defaults',
      'required',
      'serialize',
      'unserialize',
      'hidden',
      'validate'
    ), {
      serialize: _.identity,
      unserialize: _.identity
    });
  }, this);
  if (_.isEmpty(this.links)) {
    delete this.links;
  }
  this.hooks = _.pick(this.hooks,
    'willGet',
    'willPost',
    'willPatch',
    'willDelete',
    'didGet',
    'didPost',
    'didPatch',
    'didDelete'
  );
};

Type.prototype.defaults = function (req, newInstance, callback) {
  var resultPromise = keys.all(_.mapValues(this.fields, function (field, name) {
    if (newInstance[name] === undefined) {
      if (field.required) {
        return when.reject(new Error('Field ' + name + ' is required'));
      }
      if (field.defaults !== undefined) {
        if (typeof field.defaults === 'function') {
          return nodefn.call(field.defaults.bind(newInstance), req).
          then(function (defaultValue) {
            newInstance[name] = defaultValue;
          });
        } else {
          newInstance[name] = field.defaults;
        }
      }
    }
  })).
  yield(newInstance);
  return nodefn.bindCallback(resultPromise, callback);
};

Type.prototype.validate = function (req, newInstance, callback) {
  newInstance = _.pick(newInstance, _.keys(this.fields));
  var resultPromise = keys.all(_.mapValues(this.fields, function (field, name) {
    if (newInstance[name] !== undefined) {
      var toValidate = field.hasMany ? newInstance[name] : [newInstance[name]];
      return when.map(toValidate, function (value) {
        if ((field.validate instanceof RegExp) && !((typeof value === 'string') && field.validate.test(value))) {
          return when.reject(new Error('Field ' + name + ' doesn\'t match regular expression ' + field.validate));
        } else if (typeof field.validate === 'function') {
          return nodefn.call(field.validate.bind(newInstance), req, value);
        }
      });
    }
  })).
  yield(newInstance);
  return nodefn.bindCallback(resultPromise, callback);
};

Type.prototype.create = function (req, fields, callback) {
  return nodefn.bindCallback(this.defaults(req, fields).then(this.validate.bind(this, req)), callback);
};

Type.prototype.serialize = function (instance) {
  var allowedDBTypes = this.orm.allowedDBTypes;
  return _.mapValues(instance, function (value, name) {
    var serialized = this.fields[name].serialize(value);
    if ((allowedDBTypes.indexOf(typeof serialized) === -1) && !_.some(allowedDBTypes, function (type) {
      return (typeof type === 'function') && (serialized instanceof type);
    })) {
      throw new Error('Invalid type for field : ' + name);
    }
    return serialized;
  }, this);
};

Type.prototype.outputFormat = function (req, instance, callback) {
  var output = _.clone(instance);
  var resultPromise = keys.all(_.mapValues(instance, function (value, name) {
    if (typeof this.fields[name].hidden === 'function') {
      return nodefn.call(this.fields[name].hidden.bind(instance), req).
      then(function (hidden) {
        if (hidden) {
          delete output[name];
        } else {
          return this.fields[name].unserialize(value);
        }
      });
    } else if (this.fields[name].hidden) {
      delete output[name];
    } else {
      return this.fields[name].unserialize(value);
    }
  }, this)).
  yield(output);
  return nodefn.bindCallback(resultPromise, callback);
};

Type.prototype.get = function (req, res, next) {
  when(
    // function () {
    //   if (typeof this.willGet === 'function') {
    //     return nodefn.call(this.willGet.bind(this), req);
    //   }
    // }.bind(this)
  ).
  then(nodefn.lift(this.orm.read.bind(this.orm), this, req.params.ids.split(','))).
  then(function (result) {
    var output = result;
    if (result instanceof Array) {
      output = {};
      output[this.collection] = result;
    }
    if (_.every(output[this.collection], _.isNull)) {
      throw new ClientError(404);
    }
    return keys.all(_.mapValues(output, function (instances, collection) {
      var type = this.typesByCollection[collection];
      return when.map(instances, function (instance) {
        return nodefn.call(type.outputFormat.bind(type), req, instance);
      });
    }, this));
  }.bind(this)).
  then(function (result) {
    var output = _.pick(result, this.collection);
    var linked = _.omit(result, this.collection);
    if (!_.isEmpty(linked)) {
      output.linked = linked;
    }
    if (this.links) {
      output.links = this.links;
    }
    if (this.meta) {
      output.meta = req.meta;
    }
    res.send(output);
  }.bind(this)).
  otherwise(next);
};

Type.prototype.post = function (req, res, next) {
  if (!(req.body && (req.body[this.collection] instanceof Array) && (req.body[this.collection].length === 1))) {
    throw new ClientError(400, 'Malformed body');
  }
  when(
    // function () {
    //   if (typeof this.willPost === 'function') {
    //     return nodefn.call(this.willPost.bind(this), req);
    //   }
    // }.bind(this)
  ).
  then(nodefn.lift(this.orm.read.bind(this.orm), this, req.body[this.collection][0])).
  then(nodefn.lift(this.outputFormat.bind(this), req)).
  then(function (createdInstance) {
    var output = {};
    output[this.collection] = [createdInstance];
    res.set('Location', this.orm.mountPoint + '/' + this.collection + '/' + createdInstance[this.orm.primaryKeyName]);
    res.statusCode = 201;
    res.send(output);
  }.bind(this)).
  otherwise(next);
};

Type.prototype.patch = function (req, res, next) {
  var err = new ClientError(400, 'Malformed body');
  if (!(req.body && (req.body instanceof Array))) {
    throw err;
  }
  nodefn.call(this.validate.bind(this), _.zipObject(_.compact(req.body.map(function (patch) {
    if (!patch.path) {
      throw err;
    }
    if (/add|replace/.test(patch.op)) {
      return [patch.path.replace(new RegExp('/' + this.collection + '/0/?(links/)?', 'i'), ''), patch.value];
    }
  }.bind(this))))).
  then(
    // function () {
    //   if (typeof this.willPatch === 'function') {
    //     return nodefn.call(this.willPatch.bind(this), req);
    //   }
    // }.bind(this)
  ).
  then(nodefn.lift(this.orm.update.bind(this.orm), this, {
    id: req.params.is,
    patch: req.body
  })).
  then(nodefn.lift(this.outputFormat.bind(this), req)).
  then(function (updatedInstance) {
    var output = {};
    output[this.collection] = [updatedInstance];
    res.send(output);
  }.bind(this)).
  otherwise(next);
};

Type.prototype.delete = function (req, res, next) {
  when(
    // function () {
    //   if (typeof this.willDelete === 'function') {
    //     return nodefn.call(this.willDelete.bind(this), req);
    //   }
    // }.bind(this)
  ).
  then(nodefn.lift(this.orm.delete.bind(this.orm), this, req.params.id)).
  then(function () {
    res.statusCode = 204;
    res.end();
  }).
  otherwise(next);
};

// Middleware for ExpressJS
// ------------------------
Type.prototype.exposeOnServer = function (expressServer) {
  expressServer.get(this.getRoute || ('/' + this.collection + '/:ids'), this.get.bind(this));
  expressServer.post(this.postRoute || ('/' + this.collection), this.post.bind(this));
  expressServer.patch(this.patchRoute || ('/' + this.collection + '/:id'), this.patch.bind(this));
  expressServer.delete(this.deleteRoute || ('/' + this.collection + '/:id'), this.delete.bind(this));
};
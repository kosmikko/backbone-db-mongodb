var _ = require('underscore')
  , Db = require('backbone-db')
  , debug = require('debug')('backbone-db-mongodb')
  , ObjectId = require('mongodb').BSONPure.ObjectID;

function MongoDB (client) {
  if(!client) throw new Error('Db.MongoDB requires a connected mongo client');
  this.client = client;
}

function convertSort(sortProp) {
  var sortOrder = 1;
  if(sortProp && sortProp[0] === "-") {
    sortOrder = -1;
    sortProp = sortProp.substr(1);
  }
  var ret = {};
  ret[sortProp] = sortOrder;
  return ret;
}

MongoDB.sync = Db.sync;
_.extend(MongoDB.prototype, Db.prototype, {
  _getCollection: function(model, options, callback) {
    if(options && options.mongo_collection) {
      this.client.collection(options.mongo_collection, callback);
    } else if (model && model.mongo_collection) {
      this.client.collection(model.mongo_collection, callback);
    } else if(model && model.model && model.model.mongo_collection) {
      this.client.collection(model.model.mongo_collection, callback);
    } else {
      throw new Error('Cannot get collection for ' + model.type);
    }
  },

  findAll: function(model, options, callback) {
    options = options || {};
    var query = options.where || {};
    var offset = options.offset || 0;
    var limit = options.limit || this.limit || 50;
    var sort = options.sort ? convertSort(options.sort) : {$natural: 1};
    if(options.after_id) {
      query._id = {
        $gt: options.after_id
      };
    } else if(options.before_id) {
      query._id = {
        $lt: options.before_id
      };
    }
    debug('findAll', query, 'limit:', limit, 'offset:', offset, 'sort:', sort);
    this._getCollection(model, options, function(err, collection) {
      if(err) return callback(err);
      collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray(callback);
    });
  },

  find: function(model, options, callback) {
    options = options || {};
    var query = options.where || {_id:model.get(model.idAttribute)};
    debug('find', query);
    this._getCollection(model, options, function(err, col) {
      if(err) return callback(err);
      col.findOne(query, callback);
    });
  },

  create: function(model, options, callback) {
    var self = this;
    var key = this._getCollection(model, options);

    debug('create: ' + key);
    if (model.isNew()) {
      this.createId(model, options, function(err) {
        if(err) callback(err);
        self.update(model, options, callback);
      });
    } else {
      self.update(model, options, callback);
    }
  },

  createId: function(model, options, callback) {
    var createIdFn = model.createId ? model.createId : this._createDefaultId;
    createIdFn(function(err, id) {
      model.set(model.idAttribute, id);
      model.set('_id', id);
      callback(err);
    });
  },

  _createDefaultId: function(callback) {
    callback(null, new ObjectId());
  },

  update: function(model, options, callback) {
    var self = this;
    debug('update:' + model.id);
    if(model.isNew()) {
      return this.create(model, options, callback);
    }
    if(!model.has('_id') && model.has(model.idAttribute)) {
      model.set('_id', model.get(model.idAttribute));
    }
    if(options.inc) {
      return this.inc(model, options, callback);
    }
    this._getCollection(model, options, function(err, collection) {
      if(err) return callback(err);
      collection.save(model.toJSON(), callback);
    });
  },

  destroy: function(model, options, callback) {
    var self = this;
    debug("destroy: " + model.id);
    if (model.isNew()) {
      return false;
    }
    this._getCollection(model, options, function(err, collection) {
      if(err) return callback(err);
      collection.remove({_id: model.id}, callback);
    });
  },

  inc: function(model, options, callback) {
    if(!options || !options.inc || !options.inc.attribute) {
      throw new Error('inc settings must be defined');
    }
    var attribute = options.inc.attribute;
    var amount = options.inc.amount || 1;
    var inc = {};
    inc[attribute] = amount;
    debug('inc:' + JSON.stringify(inc));
    this._getCollection(model, options, function(err, col) {
      if(err) return callback(err);
      col.update(
        {_id: model.id},
        {$inc: inc},
        {upsert: options.upsert || false},
        callback
      );
    });
  }
});

module.exports = Db.MongoDB = MongoDB;



var _ = require('underscore')
  , Db = require('backbone-db')
  , debug = require('debug')('backbone-db-mongodb')
  , ObjectId = require('mongodb').BSONPure.ObjectID;

function MongoDB (client) {
  if(!client) throw new Error('Db.MongoDB requires a connected mongo client');
  this.client = client;
};

MongoDB.sync = Db.sync;
_.extend(MongoDB.prototype, Db.prototype, {
  _getCollection: function(model, options, callback) {
    if(options && options.mongo_collection) {
      this.client.collection(options.mongo_collection, callback);
    } else if (model && model.mongo_collection) {
      this.client.collection(model.mongo_collection, callback);
    } else if(model && model.model && model.model.mongo_collection) {
      this.client.collection(model.model.mongo_collection, callback);
    }
  },

  findAll: function(model, options, callback) {
    debug('findAll');
    options = options || {};
    var query = options.query || {};
    var skip = options.skip || 0;
    var limit = options.limit || this.limit || 50;
    this._getCollection(model, options, function(err, collection) {
      if(err) return callback(err);
      collection.find(query).skip(skip).limit(limit).exec().toArray(callback);
    });
  },

  find: function(model, options, callback) {
    debug('find');
    options = options || {};
    var query = options.query || {_id:model.get(model.idAttribute)};
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
    this._getCollection(model, options, function(err, collection) {
      if(err) return callback(err);
      collection.save(model.toJSON(), callback);
    });
  }
});

module.exports = Db.MongoDB = MongoDB;



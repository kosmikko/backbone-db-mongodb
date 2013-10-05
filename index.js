var _ = require('underscore')
  , Db = require('backbone-db')
  , debug = require('debug')('backbone-db-mongodb');



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
    debug("lol");
    options = options || {};
    var query = options.query || {};
    var skip = options.skip || 0;
    var limit = options.limit || this.limit || 50;
    this._getCollection(model, options, function(err, collection) {
      console.log(err, collection);
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

    debug('Create '+key);
    if (model.isNew() && model.createId) {
      model.createId(function(err, id) {
        if(err) {
          return callback(err);
        }
        model.set(model.idAttribute, id);
        model.set('_id', id);
        self.update(model, options, callback);
      });
    } else {
      self.update(model, options, callback);
    }
  },
  update: function(model, options, callback) {
    var self = this;
    debug('update:');
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



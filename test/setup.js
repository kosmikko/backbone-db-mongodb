var assert = require('assert');
var _ = require('underscore');
var MongoDB = require('../');
var Backbone = require('backbone');
var Promises = require('backbone-promises');
var Model = Promises.Model;
var Collection = Promises.Collection;
var format = require('util').format;
var MongoClient =  require('mongodb').MongoClient;
var db;
var store;
var type = 'mymodels';

var MyModel = exports.MyModel = Model.extend({
  type: type,
  sync: MongoDB.sync,
  mongo_collection: type
});

var MyCollection = exports.MyCollection = Collection.extend({
  type: type,
  sync: MongoDB.sync,
  model: MyModel,
  mongo_collection: type
});

exports.setupDb = function(cb) {
  if(db) return cb(null, db);
  MongoClient.connect("mongodb://localhost:30002/backbone-db-tests", {}, function(err, database) {
    if(err) {
      console.error("Start mongoDB or tune settings in test.model.js", err);
      cb(err);
    }
    db = database;
    store = new MongoDB(db);
    MyModel.prototype.db = store;
    MyCollection.prototype.db = store;
    cb(err);
  });
};

exports.clearDb = function(done) {
  db.collection(type).remove(done);
};

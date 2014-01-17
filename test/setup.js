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
  var mongoPort = process.env.MONGO_PORT || '30002';
  var url = format("mongodb://localhost:%s/backbone-db-tests", mongoPort);
  MongoClient.connect(url, {}, function(err, database) {
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

var fixtures = [
  {id: 1, value: 1, name: 'a'},
  {id: 2, value: 2, name: 'b'},
  {id: 3, value: 3, name: 'c'},
  {id: 4, value: 2, name: 'c'},
];

exports.insertFixtureData = function(collection, cb) {
  var fns = [];
  _.each(fixtures, function(row) {
    fns.push(collection.create(row));
  });

  Promises.when.all(fns)
    .then(function() {
      cb(null);
    })
    .otherwise(function(err) {
      cb(err);
    });
};
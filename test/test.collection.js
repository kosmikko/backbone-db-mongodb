var assert = require('assert');
var _ = require('underscore');
var MongoDB = require('../');
var Backbone = require('backbone');
var Promises = require('backbone-promises');
var Model = Promises.Model;
var Collection = Promises.Collection;
var format = require('util').format;
var MongoClient =  require('mongodb').MongoClient;


describe('MongoDB', function() {
  var db, MyModel;
  before(function(next) {
    MongoClient.connect("mongodb://localhost:30002/backbone-db-tests_?", {}, function(err, database) {
      if(err) {
        console.error("Start mongoDB or tune settings in test.model.js", err);
        process.exit();
      }
      db = database;
      var store = new MongoDB(db);
      MyModel = Model.extend({
        db: store,
        sync: MongoDB.sync,
        mongo_collection: 'mymodels'
      });
      next();
    });
  });
  describe('#Collection', function() {
    it('should .save from store', function(t) {
      t();
    });
  });
});

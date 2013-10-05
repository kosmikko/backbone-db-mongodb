var assert = require('assert');
var _ = require('underscore');
var MongoDB = require('../');
var Backbone = require('backbone');
var Model = require('backbone-promises').Model;
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
  describe('#Model', function() {
    it('should .save from store', function(t) {
      var m = new MyModel({id:1, "asd":"das"});
      m.save().then(function() {
        var m2 = new MyModel({id:1});
        m2.fetch().then(function() {
          assert.equal(m2.get("asd"),"das");
          t();
        }, assert);
      });
    });
  });
});
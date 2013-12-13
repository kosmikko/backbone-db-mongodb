var assert = require('assert');
var _ = require('underscore');
var MongoDB = require('../');
var Backbone = require('backbone');
var Model = require('backbone-promises').Model;
var format = require('util').format;
var MongoClient =  require('mongodb').MongoClient;

describe('MongoDB', function() {
  var type = 'mymodels';
  var db;
  var MyModel = Model.extend({
    type: type,
    mongo_collection: type
  });
  var id;

  before(function(next) {
    MongoClient.connect('mongodb://localhost:30002/backbone-db-tests', {}, function(err, database) {
      if(err) {
        console.error('Start mongoDB or tune settings in test.model.js', err);
        process.exit();
      }
      db = database;
      var store = new MongoDB(db);
      MyModel.prototype.db = store;
      MyModel.prototype.sync = MongoDB.sync;
      next();
    });
  });

  after(function(done) {
    db.collection(type).remove(done);
  });

  describe('#Model', function() {
    it('should .save model with given id', function(done) {
      var m = new MyModel({
        id: 1,
        asd: 'das'
      });
      m.save().then(function() {
        done();
      });
    });

    it('should fetch saved model', function(done) {
      var m2 = new MyModel({id:1});
      m2
        .fetch()
        .then(function() {
          assert.equal(m2.get('asd'),'das');
          done();
        }, assert).otherwise(done);
    });

    it('should .save model without id', function(done) {
      var m = new MyModel({data: 'foo'});
      m.save().then(function(m) {
        id = m.get('id');
        done();
      }).otherwise(done);
    });

    it('should fetch saved model', function(done) {
      var m = new MyModel({id: id});
      m
        .fetch()
        .then(function() {
          assert.equal(m.get('data'),'foo');
          done();
        }, assert).otherwise(done);
    });

  });
});
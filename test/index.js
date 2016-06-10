var assert = require('chai').assert;
var should = require('chai').should();
var Sequelize = require('sequelize');
var db = new Sequelize('postgresql://olivier@localhost/olivier');
var userModel = require('../index.js');
var User = userModel.define(db, 'user');

describe("Test user creation >>", function(){
   it('initialize the DB', function () {
      return db.drop().then(function(){
        return db.sync();
      });
   })
   it('create a user', function () {
     return User.createUser({login:"yodutouf", email:"yodutouf@gmail.com", password:"toto"}).then(function(result){
       should.exist(result);
       result.should.be.an('object');
       assert.equal(result.emailIsValid, false);
       should.exist(result.unicAction)
       var unic = result.get({ plain: true}).unicAction[0];
       should.exist(unic.hash);
       should.exist(unic.action);
       should.exist(unic.limitDateValidity);
    })
   })
   it('create same user', function () {
     return User.createUser({login:"yodutouf", email:"yodutouf@gmail.com", password:"toto"})
     .then(function(result){
       should.not.exist(result);
     }).catch(function(error){
       console.log("error ", error);
       should.exist(error);
     })
   })


})

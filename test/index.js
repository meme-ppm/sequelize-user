var assert = require('chai').assert;
var should = require('chai').should();
var Sequelize = require('sequelize');
var db = new Sequelize('postgresql://test1:test1@localhost/test1');
var userModel = require('../index.js');
var User = userModel.define(db, 'user');
var bcrypt = require("bcrypt-then");

describe("Test user creation >>", function(){
   it('initialize the DB', function () {
      return db.drop().then(function(){
        return db.sync();
      });
   })
   it('create a user', function () {
     return User.createUser({login:"tarama", email:"tarama@gmail.com", password:"toto"}).then(function(result){
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
   it('create a user with same login', function () {
     return User.createUser({login:"tarama", email:"tarama32@gmail.com", password:"toto"})
     .then(function(result){
       should.not.exist(result);
     }).catch(function(error){
       console.log("error ", error);
       should.exist(error);
     })
   })
   it('create a user with same email', function () {
     return User.createUser({login:"tarama32", email:"tarama@gmail.com", password:"toto"})
     .then(function(result){
       should.not.exist(result);
     }).catch(function(error){
       console.log("error ", error);
       should.exist(error);
     })
   })
   it('bcrypt - hash password and test with similar', function () {
     return bcrypt.hash("toto").then(function(hash){
       return bcrypt.compare("toto", hash).then(function(result){
         assert.equal(result, true);
       })
     })
   })
   it('find user tarama with good login/password', function () {
     return User.findUser('tarama','toto').then(function(user){
        should.exist(user);
     }).catch(function(error){
        should.not.exist(error);
     })
   })
   it('find user tarama with good email/password', function () {
     return User.findUser('tarama@gmail.com','toto').then(function(user){
        should.exist(user);
     }).catch(function(error){
        should.not.exist(error);
     })
   })
   it('find user tarama with wrong email and good password', function () {
     return User.findUser('tarama3@gmail.com','toto').then(function(user){
        should.not.exist(user);
     }).catch(function(error){
        should.exist(error);
        assert.equal(error.message, "user.notFound");
     })
   })
   it('find user tarama with good email and wrong password', function () {
     return User.findUser('tarama@gmail.com','toto1').then(function(user){
        should.not.exist(user);
     }).catch(function(error){
        should.exist(error);
        assert.equal(error.message, "user.wrongPassword");
     })
   })


})

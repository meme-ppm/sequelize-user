var assert = require('chai').assert;
var should = require('chai').should();

var settings = require('./settings.js');
var nodeMailer = require('nodemailer');
/**
Email template test
**/
var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var templatesDir = path.resolve(__dirname, '.', 'emailTemplate')
var templateConfirmEmail = new EmailTemplate(path.join(templatesDir, 'confirmEmail'))

var Sequelize = require('sequelize');
var db = new Sequelize('postgresql://test1:test1@localhost/test1');
var userModel = require('../index.js');

var User = userModel.define(db, 'user', {
                                          email:{
                                            smtp:settings.smtp,
                                            sender: settings.sender,
                                            debug:true,
                                            debugReceiver:settings.receiver,
                                            template:{
                                                      validateEmail: templateConfirmEmail
                                                    }
                                              }
                                          });

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
   /*it('test node mailer', function () {
     var transporter = nodeMailer.createTransport(settings.smtp);
     var mailOptions = {
       from: settings.sender, // sender address
       to: settings.receiver, // list of receivers
       subject: 'Hello ✔', // Subject line
       text: 'Hello world', // plaintext body
       html: '<b>Hello world</b>' // html body
     };
     return transporter.sendMail(mailOptions).then(function(info){
       should.exist(info);
       console.log(">> Info: ", info)
     }).catch(function(error){
       console.log(">> Error: ", error)
       should.not.exist(error);
     })
   })*/

})

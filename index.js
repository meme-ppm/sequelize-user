var Sequelize = require('sequelize');
var bcrypt = require('bcrypt-then');
var unicActionModel = require('sequelize-unic-action');
var nodeMailer = require('nodemailer');
var mailTransporter;
var _options;
var UnicAction = null;

var stopEmailSending = function(){
  return 'send' in _options.email && !_options.email.send;
}

var _model = {
        login: {type:Sequelize.STRING, allowNull:false, unique:true},
        email: {type:Sequelize.STRING, allowNull: false, unique:true},
        emailIsValid:{type: Sequelize.BOOLEAN, defaultValue: false},
        password: {type: Sequelize.STRING, allowNull: false, min:8}
}

var _methods={
  hooks: {
    afterValidate: function(user){
      return bcrypt.hash(user.password).then(function(hash){
        user.password = hash;
      })
    }
  },
  classMethods:{
    createUser: function(obj){
        obj.unicAction={action:'validateEmail'};
        var createPr =  this.create(obj, {include:[{model: UnicAction, as:'unicAction'}]});
        if(stopEmailSending()){
          return createPr;
        }
        var emailTemplatePr = createPr.then(function(user){
          var userPlain = user.get({ plain: true});
          return _options.email.template.validateEmail.render({user: user, unicAction: user.unicAction[0]});
        });
        var emailPr = emailTemplatePr.then(function(render){
          var mailOptions = {
            from: _options.email.sender,
            to: _options.email.debug?_options.email.debugReceiver:user.email,
            subject: render.subject,
            text: render.text,
            html: render.html
          };
          return mailTransporter.sendMail(mailOptions).then(function(email){
            return createPr.value();
          });
        });
        return emailPr;
    },
    findUser:function(loginEmail, password){
       var find = this.findOne({where:{$or:[{login: loginEmail},{email: loginEmail}]}});
       var compare = find.then(function(user){
         if(user == null){
           throw new Sequelize.ValidationError("user.notFound");
         }
         return bcrypt.compare(password, user.password);
       })

       return Promise.all([find, compare]).then(function(results){
         if(!results[1]){
           throw new Sequelize.ValidationError("user.wrongPassword");
         }
         return results[0];
       })
    },
    validateHash:function(hash, action){
      return UnicAction.validateHash(hash,action);
    },
    findUserFromHash:function(hash,action){
      return this.findOne({include:[{model: UnicAction, as:'unicAction', where:unicActionModel.generateWhereFromHash(hash,action)}]});
    },
    resetPassword:function(email){
      var findPr = this.findOne({where:{email: email}});
      var addUnicActionPr = findPr.then(function(user){
        if(user == null){
          throw new Sequelize.ValidationError("user.notFound");
        }
        return user.createUnicAction({action:"resetPassword"});
      })
      if(stopEmailSending()){
        return addUnicActionPr;
      }
      var emailTemplatePr = addUnicActionPr.then(function(user){
        var userPlain = findPr.value().get({ plain: true});
        var unicActionPlain = addUnicActionPr.value().get({ plain: true});
        return _options.email.template.resetPassword.render({user: user, unicAction: unicActionPlain});
      });
      var emailPr = emailTemplatePr.then(function(render){
        var mailOptions = {
          from: _options.email.sender,
          to: _options.email.debug?_options.email.debugReceiver:user.email,
          subject: render.subject,
          text: render.text,
          html: render.html
        };
        return mailTransporter.sendMail(mailOptions).then(function(email){
          return findPr.value();
        });
      });
      return emailPr;
    }
  },
  instanceMethods:{

  }
}

module.exports.model = _model;

module.exports.methods = _methods;


module.exports.define=function(db, fullModel){
    _options = fullModel.options;
    mailTransporter = nodeMailer.createTransport(_options.email.smtp, _options.email.nodeMailer);
    var User = db.define(fullModel.tableName, fullModel.model, fullModel.methods);
    UnicAction = db.define(fullModel.tableName+'_unic_action', unicActionModel.model, unicActionModel.methods);
    User.hasMany(UnicAction,{as:"unicAction"});
    return User;
}

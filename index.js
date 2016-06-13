var Sequelize = require('sequelize');
var bcrypt = require('bcrypt-then');
var unicActionModel = require('sequelize-unic-action');
var UnicAction = null;

var mergeModel = function(model){
    return Sequelize.Utils._.merge({
        login: {type:Sequelize.STRING, allowNull:false, unique:true},
        email: {type:Sequelize.STRING, allowNull: false, unique:true},
        emailIsValid:{type: Sequelize.BOOLEAN, defaultValue: false},
        password: {type: Sequelize.STRING, allowNull: false}
    }, model);
}

var methods={
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
        return this.create(obj, {include:[{model: UnicAction, as:'unicAction'}]});
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
    }
  },
  instanceMethods:{

  }
}


module.exports.define=function(db, tableName, options){
    var User = db.define(tableName, mergeModel({}), methods);
    UnicAction = db.define('user_unic_action', unicActionModel.model, unicActionModel.methods);
    User.hasMany(UnicAction,{as:"unicAction"});
    return User;
}

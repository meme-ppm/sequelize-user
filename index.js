var Sequelize = require('sequelize');
var unicActionModel = require('sequelize-unic-action');
var UnicAction = null;

var mergeModel = function(model){
    return Sequelize.Utils._.merge({
        login: {type:Sequelize.STRING, allowNull:false, unique:true},
        email: {type:Sequelize.STRING, allowNull: false, unique:true},
        emailIsValid:{type: Sequelize.BOOLEAN, defaultValue: false},
        password: {type: Sequelize.STRING, allNull: false},
    }, model);
}

var methods={
  classMethods:{
    createUser: function(obj){
        obj.emailValidate = false;
        obj.unicAction={action:'validateEmail'};
        return this.create(obj, {include:[{model: UnicAction, as:'unicAction'}]});
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
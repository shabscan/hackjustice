"use strict";
var mail = require('../../utils/mail').mail,
User = require('../../models/user').user.getModel(),
crypt = require('../../utils/crypt').crypt,
nJwt = require('njwt'),
decisionTree = require('../../res/decision-tree.js');

class PostUser{

    /**
    */
    constructor() {}

    situation(userInfo){
      return new Promise(
      (resolve, reject)=>{

        /**
        the first two filters are:
        the user's income. If they make more than the threshold amount,then they cannot pretend to this option
        the user's marital status
        */
        var remainingOptions = decisionTree.filter((curr)=>{
          var res = userInfo.income < curr.income && userInfo.maritalStatus === curr.maritalStatus;
          // if the requirements are met, then res is reset and will be true again only if at least one of the issues match
          if(res){
            res = false;
            for(var cpt=0, max=userInfo.issues.length; cpt<max; cpt++){
              if(curr.issues.indexOf(userInfo.issues[cpt]) !== -1){
                res = true;
                cpt = max;
              }
            }
          }
          return res;
        })
        .map((curr)=>{return curr.option;});

        resolve(remainingOptions);
      });

    }


    /**

    */
    login(credentials){

      return new Promise(
      (resolve, reject)=>{
        // checking if the user exists in the database
        User.findOne({'login':credentials.email}, function(err, user){
          if(err){
            reject(err);
          }
          else{
            // if no user has been found, then the request is rejected
            if(!user){
              reject('user not found');
            }
            // here the user is known, so we check their password
            else{
              crypt.compare(user.password, credentials.pwd)
              .then(function (result) {
                // the passowrd is correct, an authentification token is created, stored, then sent back
                var auth = crypt.createToken(user.login);
                user.token = auth.token;
                user.tokenKey = auth.key;
                user.save(function(err){
                  if(err){
                    reject(err);
                  }
                  else{
                    resolve({'code':user.code, 'email':user.email, 'username':user.username, 'token':auth.token});
                  }
                });

              }).catch(function (err) {
                // the password is wrong, so the login is forbidden
                reject('wrong credentials');
              });

            }
          }
        });
      });

    }


    /**
    Checking if the user is validated
    @param credentials is an object login, pwd
    */
    signup(credentials){
      return new Promise(
      (resolve, reject)=>{
        User.findOne( {$or:[{'login':credentials.email}, {'username':credentials.username}]} )
        .exec(function(err, user){
          if(err){
            reject(err);
          }
          else{
            if(user){
              reject('this user already exists');
            }
            else{
              var auth = crypt.createToken(credentials.email),
              code = crypt.createCode();

              crypt.hash(credentials.pwd)
              .then(function(hash) {

                var newUser = {
                  'code': code,
                  'login':credentials.email,
                  'email':credentials.email,
                  'username':credentials.username,
                  'password':hash,
                  'token':auth.token,
                  'tokenKey':auth.key,
                };
                User.create(newUser, function(err, user){
                  if(err){
                    reject(err.message);
                  }
                  else{
                    resolve({'code':newUser.code, 'email':newUser.email, 'username':newUser.username, 'token':auth.token});
                  }
                });
              })
              .catch(function (err) {
                reject(err);
              });

            }
          }
        });

      });

    }


    /**
    Checking the user's token
    @param the token
    */
    checkToken(token){
      return new Promise(
      (resolve, reject)=>{
        console.log('in check token');
        User.findOne({'token':''+token})
        .exec(function(err, user){
          if(err){
            reject(err);
          }
          else{
            if(user){
              resolve(user);

              nJwt.verify(token, user.tokenKey, function(err,verifiedJwt){
                if(err){
                  reject(err);
                }
                else{
                  console.log('finish token ok');
                  resolve(user);
                }
              });

            }
            else{
              reject('unknown user');
            }
          }
        });
      });

    }



}
module.exports.post = new PostUser();

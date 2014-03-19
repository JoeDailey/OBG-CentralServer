//Database Start//////////////////////////////////////////////////////////////////////////
var fs = require("fs");
////////CREATE DATABSE IF IT DOESN'T EXIST
var file = __dirname + "/db.sqlite";
var path = require('path');
var exists = fs.existsSync(file);

if (!exists) {
    console.log("Creating DB file.");
    fs.openSync(file, "w");
}
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
if (!exists) {
    console.log("create new db");
    db.serialize(function () {
        var dberr = "no error";
        db.run('CREATE TABLE "passwords" ("email" VARCHAR(90) NOT NULL UNIQUE, "password" VARCHAR(50) NOT NULL, "created_at" DATETIME NOT NULL  DEFAULT CURRENT_TIMESTAMP);', function(err){ dberr = err; }); 
        db.run('CREATE TABLE "users" ("user_id" Integer Primary Key NOT NULL UNIQUE, "user_name" blob NOT NULL);', function(err){ dberr = err; });
        db.run('CREATE TABLE "passwords" ("user_id Integer NOT NULL UNIQUE", "hash", blob NOT NULL);', function(err){ dberr = err; });
        db.run('CREATE TABLE "asset_packs" ("asset_pack_id" blob NOT NULL, "asset_pack_name" blob NOT NULL, "user_id" Integer NOT NULL, "image_url" blob NOT NULL);', function(err){ dberr = err; });
        db.run('CREATE TABLE "asset_version" ("asset_version_id" Primary Key integer NOT NULL, "asset_pack_id" integer NOT NULL, "asset_url" blob integer NOT NULL, "change_log" blob, "version" real NOT NULL);', function(err){ dberr = err; })
        db.run('CREATE TABLE "subscriptions" ("user_id" Integer NOT NULL, "asset_pack_id" integer NOT NULL, "asset_version_id" integer);', function(err){ dberr = err; });
        if(dberr!="no error"){
            console.log(dberr);
            fs.unlink(file);
        }
    });
}
/////////END CREATE DATABASE
//Database End/////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Set Up Start///////////////////////////////////////////////////////////////////////////
//rendering///////////////////////////////////////////////////////////////////////////// 
var express = require('express');
var OBG = express();
OBG.set('view engine', 'ejs');
//uuid/////////////////////////////////////////////////////////////////////////////////////
var uuid = require('node-uuid');
//file moving//////////////////////////////////////////////////////////////////////////////

//email////////////////////////////////////////////////////////////////////////////////////
OBG.set("views", __dirname+'/views');
//path/////////////////////////////////////////////////////////////////////////////////////
OBG.use("/static", express.static(__dirname + '/static')); //static
//favicon//////////////////////////////////////////////////////////////////////////////////
OBG.use(express.favicon(__dirname + '/static/img/favicon.png'));
//cookies//////////////////////////////////////////////////////////////////////////////////
OBG.use(express.cookieParser('gamesandboardsandgames'));
OBG.use(express.session({secret: 'boardsandgamesandboards'}));
//body parsing/////////////////////////////////////////////////////////////////////////////
OBG.use(express.bodyParser({uploadDir:__dirname + '/static/asspacks/temporary/'}));
OBG.set('view options', {
    layout: false
});
//setup password encryption
var bcrypt = require('bcrypt-nodejs');
//encrypt password -> callback(err, hash)
var cryptPassword = function (password, callback) {
   bcrypt.genSalt(10, function (err, salt) {
    if (err) return callback(err);
      else {
        bcrypt.hash(password, salt, function (err, hash) {
            return callback(err, hash);
        });
      }
  });
};
//decript password -> callback(bool matches)
var comparePassword = function (password, userPassword, callback) {
   bcrypt.compare(password, userPassword, function (err, isPasswordMatch) {
      if (err) return callback(err);
      else return callback(null, isPasswordMatch);
   });
};
//start server

OBG.listen(9001);
//Set Up End///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//RoutingStart///////////////////////////////////////////////////////////////////////////
//---------------------------------------------/////-landing page |home<--cookie-->admin|
OBG.get('/', function (req, res){
    res.render('home', {});
});
//
OBG.get('/signin', function(req, res){
    user = {
        name:"user_name",
        link:"/user/asdf"
    }
    res.cookie('user', JSON.stringify(user), { signed: true });
    res.redirect('/');
});
//404 Error start/////////////////////////////////////////////////////////////////////////
OBG.get("*", function (req, res){
    res.render('front_error', {
        "errorNumber":404,
        "comment":"Sorry, you seem to have gone to page that does not exist."
    });
    console.log(req.path);
    res.send(404, {});
});
//404 Error end/////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
//Misc Start//////////////////////////////////////////////////////////////////////////////
//base cookie check and navigation building
var getUser = function (){
    if (req.signedCookies.user == undefined) {   
        return {
            name:'Sign In',
            link:'/signup',
            options:[
                {
                    name:'Sign Up',
                    link:'/signup'
                }
            ]
        }
    } else {
        return JSON.parse(req.signedCookies.user);
    }
}
// merge two objects
function merge(obj1, obj2){
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
    return obj1;
}
//Misc End//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

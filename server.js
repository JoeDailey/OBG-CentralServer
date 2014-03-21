/*
	All following code and comments written by Joseph L Dailey unless stated otherwise
	All Rights Reserved
*/
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
	db.serialize(function () {
		var dberr = "no error";
		db.run('CREATE TABLE "users" ("user_id" Integer Primary Key NOT NULL UNIQUE, "user_email" blob NOT NULL, "user_name" blob NOT NULL, "activated" boolean NOT NULL DEFAULT false);', function(err){ if(err) dberr = err; });
		db.run('CREATE TABLE "passwords" ("user_id" Integer NOT NULL UNIQUE, "hash" blob NOT NULL);', function(err){ if(err) dberr = err; });
		db.run('CREATE TABLE "asset_packs" ("asset_pack_id" blob NOT NULL, "asset_pack_name" blob NOT NULL, "user_id" Integer NOT NULL, "image_url" blob NOT NULL);', function(err){ if(err) dberr = err; });
		db.run('CREATE TABLE "asset_version" ("asset_version_id" Primary Key integer NOT NULL, "asset_pack_id" integer NOT NULL, "asset_url" blob integer NOT NULL, "change_log" blob, "version" real NOT NULL);', function(err){ if(err) dberr = err; })
		db.run('CREATE TABLE "subscriptions" ("user_id" Integer NOT NULL, "asset_pack_id" integer NOT NULL, "asset_version_id" integer);', function(err){ if(err) dberr = err; });
		db.run('CREATE TABLE "stars" ("user_id" Integer NOT NULL, "asset_pack_id" integer NOT NULL, "rating" integer NOT NULL);', function(err){ if(err) dberr = err; });
		if(dberr!="no error"){
			console.log(dberr);
			fs.unlink(file);
		}else{
			console.log("no error creating database");
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
		bcrypt.hash(password, salt, null, function (err, hash) {
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
//--------------------------------------------------------------------/////-landing page
OBG.get('/', function (req, res){
	var obj = {
		title:"N4m3-0f-G4m3",
		count:9001,
		stars:3,
		image_url:"http://placehold.it/200x200",
		page_url:"/game/id",
		quick_text:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sit amet massa purus. Vestibulum vitae pretium neque. Duis sit amet massa vitae nisl faucibus fermentum. Donec posuere in est sed pellentesque. In lorem erat, mattis a purus ac, lobortis ullamcorper tortor. Pellentesque cursus ullamcorper erat sit amet convallis. Sed viverra et ipsum vel rhoncus. Quisque faucibus sodales leo, et ornare nunc accumsan non. Integer vulputate odio non lorem pulvinar, eu euismod nulla dignissim. Nam laoreet justo ac purus malesuada mollis. Aliquam placerat turpis lectus, mollis egestas turpis tempor a. Ut a odio lacus. Aliquam erat volutpat. Cras faucibus a ligula id rhoncus."
	};
	res.render('home', {games:[obj]});
});
//--------------------------------------------------------------------/////-create or sign in
OBG.get('/auth', function(req, res){
	if(req.query.m == undefined)
		res.render("auth", {});
	else{
		var errors = req.query.e.split('-');
		console.log(errors);
        var obj {
            message:req.query.m
        }
		for (var i = errors.length - 1; i >= 0; i--)
			switch(errors[i]){
                case "u_email":
			}
		res.render("auth", obj);
	}
});
//--------------------------------------------------------------------/////-you need to activate
OBG.get('/activate', function(req, res){ 
	res.render("activate", {});
});
//
OBG.post('/signup', function(req, res){
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var comfirm = req.body.confirm;
	
	db.serialize(function(){
		db.get("SELECT * FROM users WHERE user_email='"+email+"';", function(err, user){
			if(err){ authError(err, res); return; }
			if(user!=undefined){ authError("That email is already in use, did you <a href='/forgot'>forget your password?</a>", res); return; }
			cryptPassword(password, function(err, hash){
				if(err){ authError("There was a password error", res); return; }
				db.run("INSERT INTO users (user_email, user_name) values('"+email+"', '"+username+"');", function(err){
					if(err){ authError(err, res); return; }
					db.get("SELECT user_id FROM users WHERE user_email='"+email+"' AND user_name='"+username+"';", function(err, user){
						if(err){ authError(err, res); return; }
						db.run("INSERT INTO passwords (user_id, hash) values('"+user.user_id+"', '"+hash+"');", function(err){
							if(err){ authError(err, res); return; }
							res.redirect("/activate");
						});
					});						
				});
			});
		});
	});
});
var authError = function(e, res){
	console.log(e);
	res.render("auth", {message:e});
}
OBG.get('/auth', function(req, res){
	res.render("auth", {})
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

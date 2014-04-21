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
global.db = new sqlite3.Database(file);
if (!exists) {
	db.serialize(function () {
		db.run('CREATE TABLE "users" ("user_id" Integer Primary Key NOT NULL UNIQUE, "user_email" blob NOT NULL, "user_name" blob NOT NULL, "activated" boolean NOT NULL DEFAULT false, "created_at" DATETIME NOT NULL  DEFAULT CURRENT_TIMESTAMP);', function(err){ if("users", err) dberror(err); });
		db.run('CREATE TABLE "passwords" ("user_id" Integer NOT NULL UNIQUE, "hash" blob NOT NULL);', function(err){ if(err) dberror("passwords", err); });
		db.run('CREATE TABLE "asset_packs" ("asset_pack_id" blob NOT NULL, "asset_pack_name" blob NOT NULL, "user_id" Integer NOT NULL, "description" blob, "created_at" DATETIME NOT NULL  DEFAULT CURRENT_TIMESTAMP);', function( err){ if("asset_packs", err) dberror(err); });
		db.run('CREATE TABLE "asset_version" ("asset_version_id" integer Primary Key  NOT NULL, "asset_pack_id" blob NOT NULL, "asset_url" blob NOT NULL, "change_log" blob, "version" real NOT NULL, "created_at" DATETIME NOT NULL  DEFAULT CURRENT_TIMESTAMP);', function(err){ if("asset_Versions", err) dberror(err); })
		db.run('CREATE TABLE "subscriptions" ("user_id" Integer NOT NULL, "asset_pack_id" blob NOT NULL, "asset_version_id" integer);', function(err){ if(err) dberror("subscriptions", err); });
		db.run('CREATE TABLE "stars" ("user_id" Integer NOT NULL, "asset_pack_id" blob NOT NULL, "rating" integer NOT NULL);', function(err){ if(err) dberror("stars", err); });
		db.run('CREATE TABLE "images" ("user_id" Integer NOT NULL, "asset_pack_id" blob NOT NULL, "image_url" blob NOT NULL);', function(err){ if(err) dberror("images", err); });
	});
 }
var dberror = function(table, err){
	console.log(table, err);
	console.log("deleting " + file);
	if(fs.existsSync(file))
		fs.unlink(file);
 }
/////////END CREATE DATABASE
//Database End/////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Set Up Start///////////////////////////////////////////////////////////////////////////
//rendering///////////////////////////////////////////////////////////////////////////// 
var express = require('express');
var expressValidator = require('express-validator');
var OBG = express();
OBG.set('view engine', 'ejs');
global.site = require('./routes/site');
global.api = require('./routes/api');
global.user = require('./routes/user');
global.servers = require('./routes/servers');
global.util = require('./routes/util');
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
OBG.use(express.bodyParser({uploadDir:__dirname + '/static/tmp/'}));
OBG.use(expressValidator({}));
OBG.set('view options', {
	layout: false
});
OBG.use(express.logger('dev'));
OBG.use(express.json());
OBG.use(express.urlencoded());
OBG.use(express.methodOverride());
OBG.use(OBG.router);

//remote requests//////////////////////////////////////////////////////////////////////////
global.https = require('https');

//email////////////////////////////////////////////////////////////////////////////////////
var emailTemplates = require('email-templates');
var templatesDir = path.join(__dirname, 'templates');
var nodemailer = require('nodemailer');
var mailer = nodemailer.createTransport("SMTP",{
   service: "Gmail",
   auth: {
		user: "surfaceRealms.noreply@gmail.com",
		pass: "boardsandgames1"
   }
 });
//setup password encryption
var bcrypt = require('bcrypt-nodejs');
//encrypt password -> callback(err, hash)
global.cryptPassword = function (password, callback) {
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
global.comparePassword = function (password, hash, callback) {
   bcrypt.compare(password, hash, function (err, isPasswordMatch) {
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
OBG.get('/', site.root);
//--------------------------------------------------------------------/////-find games page
OBG.get('/matchmaking', site.matchmaking);
//--------------------------------------------------------------------/////-download clients
OBG.get('/download', site.download);
//--------------------------------------------------------------------/////-specific game page
OBG.get('/game/:asset_pack_id', site.ass_pk);
//--------------------------------------------------------------------/////-upload asset page
OBG.get('/upload', site.upload);
//--------------------------------------------------------------------/////-create or sign in
OBG.get('/auth', site.auth);
//--------------------------------------------------------------------/////-request to sign up
OBG.post('/signup', user.signup);
//--------------------------------------------------------------------/////-request to sign in
OBG.post('/signin', user.signin);
//--------------------------------------------------------------------/////-logout / clear cookies
OBG.get('/logout', user.logout);
//--------------------------------------------------------------------/////-you need to activate
OBG.get('/activate', site.activate);
//--------------------------------------------------------------------/////-thanks for activating
OBG.get('/activate/:user_id', user.activate);
//--------------------------------------------------------------------/////-add image, used in preview
OBG.post('/image', util.image);
//--------------------------------------------------------------------/////-delete image, keep serversize down
OBG.post('/delimage', util.delimage);
//--------------------------------------------------------------------/////-add asset pack 
OBG.post('/asset', util.upload);
//--------------------------------------------------------------------/////-set subscription
OBG.post('/api/unsubscribe', api.unsubscribe);
//--------------------------------------------------------------------/////-set unsubscription
OBG.post('/api/subscribe', api.subscribe);
//--------------------------------------------------------------------/////-remote login
OBG.post('/api/login', api.login);
//--------------------------------------------------------------------/////-start a server
OBG.post('/api/server_start', api.server_start);
//--------------------------------------------------------------------/////-keep a server alive
OBG.post('/api/server_heartbeat', api.server_heartbeat);
//--------------------------------------------------------------------/////-get server info
OBG.get('/api/server/:serverhash', api.server_info);
//--------------------------------------------------------------------/////-get server list
OBG.get('/api/servers', api.servers);
//--------------------------------------------------------------------/////-get subscriptions
OBG.get('/api/subs/:user_id', api.subs);
//--------------------------------------------------------------------/////-download specific version of ass_pk
OBG.get('/api/asset/:asset_pack_id/:asset_version_id', api.asset_version_dl);
//--------------------------------------------------------------------/////-download newestof ass_pk
OBG.get('/api/asset/:asset_pack_id/', api.asset_dl);
//--------------------------------------------------------------------/////-api call not found
OBG.get('/api/*', function(req, res){
	res.send(200, {success:false, error:"API call not found"});
 });

//404 Error start/////////////////////////////////////////////////////////////////////////
OBG.get("*", function (req, res){
	res.render('error', {
		"errorNumber":404,
		"comment":"Sorry, you seem to have gone to page that does not exist.",
		"nav":"Error"
	});
	console.log("requested path: "+req.path);
 });
//404 Error end/////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
//Misc Start//////////////////////////////////////////////////////////////////////////////
var month = ["January"
			,"February"
			,"March"
			,"April"
			,"May"
			,"June"
			,"July"
			,"August"
			,"September"
			,"October"
			,"November"
			,"December"];
//Misc End//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
//consructors/////////////////////////////////////////////////////////////////////////////
// server_name, game_name, max_num_players, host_id, ip_address, password



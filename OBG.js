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
OBG.use(express.bodyParser({uploadDir:__dirname + '/static/tmp/'}));
OBG.set('view options', {
	layout: false
});
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
var comparePassword = function (password, hash, callback) {
   bcrypt.compare(password, hash, function (err, isPasswordMatch) {
	  if (err) return callback(err);
	  else return callback(null, isPasswordMatch);
   });
};
//start server
var serverMap = {};
OBG.listen(9001);
//Set Up End///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//RoutingStart///////////////////////////////////////////////////////////////////////////
//--------------------------------------------------------------------/////-landing page
OBG.get('/', function (req, res){
	db.all("SELECT asset_packs.*, img.image_url FROM asset_packs INNER JOIN images AS img ON asset_packs.asset_pack_id=img.asset_pack_id GROUP BY asset_packs.asset_pack_id;", function(err, ass_pks){	
		if(err) console.log(err);
		if(ass_pks==undefined || ass_pks.length==0){console.log("wat?"); res.render("home", mergeUser(req.signedCookies.user, {nav:"Popular", games:[]})); return;};
		var count = -1*ass_pks.length;
		ass_pks.forEach(function(ass_pk, i) {
			db.all("SELECT * FROM stars WHERE asset_pack_id='"+ass_pk.asset_pack_id+"';",function(err, stars, i){
				if(err) console.log(err);
				if(err || stars==undefined) stars=new Array();
				var starsVal = 0;
				for (var s = 0; s < stars.length; s++) {
					console.log("i-sloop"+s+": "+i);
					starsVal += stars[s].rating;
				}
				if(stars.length == 0)
					ass_pk.stars = 0;
				else
					ass_pks.stars = Math.floor(starsVal/stars.length);
				db.all("SELECT user_id FROM subscriptions WHERE asset_pack_id='"+ass_pk.asset_pack_id+"';", function(err, subs, i){
					console.log(subs);
					if(err){ console.log(err); subs = new Array() };
					if(subs==undefined) subs = new Array();
					var is_subbed = false;
					if(req.signedCookies.user != undefined){
						var user_id = JSON.parse(req.signedCookies.user).user_id;
						for (var sub = 0; sub < subs.length; sub++)
							if(subs[sub].user_id == user_id)
								is_subbed = true;
					}
					ass_pk.is_subbed = is_subbed;
					ass_pk.count = subs.length;
					
					count++;
					if(count === 0){
						console.log(ass_pks);
						res.render('home', mergeUser(req.signedCookies.user, {nav:"Popular", games:ass_pks}));
					}
				});
			});
		});
	}); 
 });
OBG.get('/matchmaking', function(req, res){
	res.render('servers', mergeUser(req.signedCookies.user, {nav:"Servers", servers:serverMap}));
 });
OBG.get('/download', function(req, res){
	res.render('download', mergeUser(req.signedCookies.user, {nav:"Download"}));
 });
//--------------------------------------------------------------------/////-specific game page
OBG.get('/game/:asset_pack_id', function (req, res){
	db.get("SELECT * from asset_packs WHERE asset_pack_id='"+req.params.asset_pack_id+"';", function(err, ass_pk){
		db.all("SELECT * FROM stars WHERE asset_pack_id='"+req.params.asset_pack_id+"';",function(err, stars){
			var starsVal = 0;
			for (var s = 0; s < stars.length; s++)
				starsVal += stars[s].rating;
			if(stars.length == 0)
				ass_pk.stars = 0;
			else
				ass_pk.stars = Math.floor(starsVal/stars.length);
			db.all("SELECT user_id FROM subscriptions WHERE asset_pack_id='"+req.params.asset_pack_id+"';", function(err, subs){
				
				var is_subbed = false;
				if(req.signedCookies.user){	
					var user_id = JSON.parse(req.signedCookies.user).user_id;
					for (var sub = 0; sub < subs.length; sub++)
						if(subs[sub].user_id == user_id)
							is_subbed = true;
				}
				ass_pk.is_subbed = is_subbed;
				ass_pk.count = subs.length;
				db.all("SELECT image_url FROM images WHERE asset_pack_id='"+req.params.asset_pack_id+"';", function(err, imgs){
					ass_pk.images = imgs;
					console.log(ass_pk);
					res.render('game', mergeUser(req.signedCookies.user, {nav:ass_pk.asset_pack_name, game:ass_pk}));
				});
			});	
		});	
	});	
 });
//--------------------------------------------------------------------/////-upload asset page
OBG.get('/upload', function (req, res){
	if(req.signedCookies.user != undefined)
		res.render('upload', mergeUser(req.signedCookies.user, {nav:"upload"}));
	else
		res.redirect("/auth?m=You need and account before you can upload games.");
 });
//--------------------------------------------------------------------/////-create or sign in
OBG.get('/auth', function(req, res){
	if(req.query.m == undefined)
		if(req.signedCookies.user!=undefined)
			res.render("auth", {nav:"signin", message:"Warning: You are already signed in to "+JSON.parse(req.signedCookies.user).user_name});
		else
			res.render("auth", {nav:"signin"});
	else{
		res.render("auth", {nav:"signin", message:req.query.m});
	}
 });
//--------------------------------------------------------------------/////-request to sign up
OBG.post('/signup', function(req, res){
	var email = req.body.email.toLowerCase();
	var username = req.body.username;
	var password = req.body.password;
	var confirm = req.body.confirm;
	if(email.length == 0 || username.length == 0 || password.length == 0){ authError("Please supply all necessary information.", res); return;}
	if(password != confirm){ authError("Passwords did not match.", res); return;}
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
							if(err){ 
								authError(err, res); 
								db.run("DELETE FROM users WHERE user_email='"+email+"' AND user_name='"+username+"';");
								return;
							}
							emailTemplates(templatesDir, function(err, template){
								var options = { url : user.user_id};
								template('register', options, function(err, html){
									mailer.sendMail({
										from: "surfaceRealms Account Registration <surfacerealms.noreply@gmail.com>", // sender address
										to: username + "<" + email + ">", // comma separated list of receivers
										subject: "Account Registration", // Subject line
										html: html ,
									}, function (mail_error, response){
										if(mail_error){
											db.get("DELETE FROM users WHERE user_email='"+email+"' AND user_name='"+username+"';");
											db.get("DELETE FROM passwords WHERE user_id='"+user.user_id+"';");
											console.log(mail_error);
											authError("There was an error. Please try again.", res);
											return;
										}
										console.log("sent mail");
										res.redirect("/activate");
									});
								});
							});
						});
					});						
				});
			});
		});
	});
 });
//--------------------------------------------------------------------/////-request to sign in
OBG.post('/signin', function(req, res){
	var email = req.body.email.toLowerCase();
	var password = req.body.password;
	console.log("signing in with: " + email + password);
	db.serialize(function(){
		db.get("SELECT * FROM users WHERE user_email='"+email+"';", function(err, user){
			if(err){ authError(err, res); return; }
			if(user==undefined){ authError("That email is not in use.", res); return; }
			if(user.activated == false){ authError("please, check your email to activate your account <a href='/resend/"+email+"'>Resend Token?</a>", res); return; }
			db.get("SELECT * FROM passwords WHERE user_id='"+user.user_id+"';", function(err, pass){
				if(err){ authError(err, res); return; }
				if(pass==undefined){ authError("No password is set for this account. Wait.. Wat?", res); return; }
				comparePassword(password, pass.hash, function(err, match){
					if(err){ authError(err, res); return; }
					if(match==false){ authError("The password was not correct.", res); return; }
					res.cookie('user', JSON.stringify(user), {signed: true });
					res.redirect("/");
				});
			});
		});
	});
 });
//--------------------------------------------------------------------/////-logout / clear cookies
OBG.get('/logout', function(req, res){
	res.clearCookie('user');
	res.redirect('/');
 });
//--------------------------------------------------------------------/////-you need to activate
OBG.get('/activate', function(req, res){ res.render("activate", {nav:""}); });
//--------------------------------------------------------------------/////-thanks for activating
OBG.get('/activate/:user_id', function(req, res){ 
	db.serialize(function(){
		db.run("UPDATE users SET activated='true' WHERE user_id='"+req.params.user_id+"';", function(err){
			res.render("activated", {nav:""});
		});
	});
 });
//--------------------------------------------------------------------/////-add image, used in preview
OBG.post('/image', function(req, res){ 
	var image_name = '/static/ass_img/'+uuid.v4().split('-')[0]+"."+req.files.image.originalFilename.split(".")[req.files.image.originalFilename.split(".").length-1];
	fs.rename(req.files.image.path, __dirname + image_name, function(err){console.log(err);});
	db.run('INSERT INTO images (image_url, user_id, asset_pack_id) VALUES("'+image_name+'","' + JSON.parse(req.signedCookies.user).user_id + '","'+ -1 + '");', function (err){
		if(err)
			res.send(500, {url:"static/img/error_img.png"});
		else
			res.send(200, {url:image_name});
	});
 });
//--------------------------------------------------------------------/////-delete image, keep serversize down
OBG.post('/delimage', function(req, res){
	var image_name = __dirname + req.body.image;
	fs.unlink(image_name, function(err){console.log(err);});
	db.run('DELETE FROM images WHERE image_url="'+req.body.image+'";');
	res.send(200, {});
 });
//--------------------------------------------------------------------/////-add asset pack 
OBG.post('/asset', function(req, res){
	var user = JSON.parse(req.signedCookies.user);
	if(user==undefined){res.redirect("/auth?m=You need to log in to upload games."); return}
	var name = req.body.ass_name;
	var desc = req.body.ass_desc;
	var imgs = req.body.ass_imgs;
	var ass = uuid.v4().split('-')[0];
	var ass_pk = '/static/ass_pks/'+ass+"_0.asspk";
	
	fs.rename(req.files.ass_pk.path, __dirname + ass_pk, function(err){console.log(err);});
	db.serialize(function(){
		db.run("INSERT INTO asset_packs (asset_pack_id, asset_pack_name, user_id, description) VALUES ('"+ass+"', '"+name+"', '"+user.user_id+"', '"+desc+"');", function(err){
			if(err){console.log(err); res.send(404, {}); return;}
			db.run("INSERT INTO asset_version (asset_pack_id, asset_url, change_log, version) VALUES ('"+ass+"', '"+ass_pk+"', 'Initial Submission', 0);", function(err){
				if(err){console.log(err); res.send(404, {}); return;}
				imgs = imgs.split("!");
				for (var i = imgs.length - 1; i >= 0; i--) {
					db.run("UPDATE images SET asset_pack_id='"+ass+"' WHERE image_url='"+imgs[i]+"';");
				};
				res.redirect("/game/"+ass);
			});	
		});
	});
 });
//--------------------------------------------------------------------/////-set subscription
OBG.post('/api/unsubscribe', function(req, res){
	console.log("unsub");
	var ass = req.body.ass_pk_id;
	if(req.signedCookies.user==undefined){
		res.send(403, {error:"user not signed in", url:"/auth?m=Sign in to subscribe to content!"});
		return;
	}
	user = JSON.parse(req.signedCookies.user);
	db.run("DELETE FROM subscriptions WHERE user_id='"+user.user_id+"' and asset_pack_id='"+ass+"';");
 });
//--------------------------------------------------------------------/////-set subscription
OBG.post('/api/subscribe', function(req, res){
	console.log("sub");
	var ass = req.body.ass_pk_id;
	if(req.signedCookies.user==undefined){
		res.send(403, {error:"user not signed in", url:"/auth?m=Sign in to subscribe to content!"});
		return;
	}
	user = JSON.parse(req.signedCookies.user);
	db.run("INSERT INTO subscriptions (user_id, asset_pack_id) VALUES('"+user.user_id+"', '"+ass+"');", function(err){
		if(err) res.send(400, {err:err});
		else res.send(200, {});
	});
 });

OBG.post('/api/login', function(req, res){
	if(req.body.email==undefined || req.body.password==undefined){
		res.send(200, {success:false, error:"insufficient data"}); return;
	}
	var email = req.body.email.toLowerCase();
	var password = req.body.password;

	db.serialize(function(){
		db.get("SELECT * FROM users WHERE user_email='"+email+"';", function(err, user){
			if(err){ res.send(200, {success:false, error:err}); return; }
			if(user==undefined){ res.send(200, {success:false, error:"email doesn't exist"}); return; }
			if(user.activated == false){ res.send(200, {success:false, error:"not activated"}); return; }
			db.get("SELECT * FROM passwords WHERE user_id='"+user.user_id+"';", function(err, pass){
				if(err){ res.send(200, {success:false, error:err}); return; }
				if(pass==undefined){ res.send(200, {success:false, error:"no password"}); return; }
				comparePassword(password, pass.hash, function(err, match){
					if(err){ res.send(200, {success:false, error:err}); return; }
					if(match!=true){ res.send(200, {success:false, error:"password incorrect"}); return; }
					res.send(200, {success:true, "user":user});
				});
			});
		});
	});
 });

OBG.post('/api/server_start', function(req, res){
	var data = {
		server_name:req.body.server_name,
		game_name:req.body.game_name,
		max_num_players:req.body.max_num_players,
		host_id:req.body.host_id,
		server_passphrase:req.body.server_passphrase,
		ip_address:req.connection.remoteAddress
	}
	var new_server = server(data);
	serverMap[new_server.hashCode] = new_server;
	res.send(200, {success:true, gid:new_server.hashCode});
	cacheArrayValid = false;
	updateCache();
 });

OBG.post('/api/server_heartbeat', function(req, res){
	var pingtime = new Date().getTime() - req.connection._idleStart;
	var gip = req.body.gip;
	var num_players = req.body.num_players;
	var ip = req.connection.remoteAddress;
	if(gip==undefined || num_players==undefined) {res.send(200, {success:false, error:"insufficient data"}); return}
	if(serverMap[gip]!=undefined){
		serverMap[gip].ip_address=ip;
		var hash = serverMap[gip].hash();
		if(hash != gip){
			serverMap[hash] = serverMap[gip];
			delete serverMap[gip];
			cacheArrayValid = false;
			updateCache();
		}
		serverMap[hash].ping();
		serverMap[hash].num_players = num_players;
		serverMap[hash].pingtime = pingtime;
		res.send(200, {success:true, gip:hash});
	}else{
		res.send(200, {success:false, error:"not started, must ping every 5000ms or less"});
	}
 });
OBG.get('/api/server/:serverhash', function(req, res){
	if(serverMap[req.params.serverhash]==undefined){
		res.send(200, {success:false, error:"server does not exist"});
		return;
	}
	res.send(200, {success:true, server:serverMap[serverhash]});
 });

OBG.get('/api/servers', function(req, res){
	if(cacheArrayValid)
		res.send(200, {success:true, servers:cacheArray});
	else{
		updateCache(function(){
			res.send(200, {success:true, servers:cacheArray})	
		})
	}
 });


OBG.get('/api/subs', function(req, res){
	var user_id = req.query.user_id;
	db.all("SELECT asset_pack_id, asset_version_id FROM subscriptions WHERE user_id='"+user_id+"';", function(err, subs){
		if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
		if(subs == undefined) subs = new Array();
		for (var i = 0; i < subs.length; i++) {
			if(subs[i].asset_version_id == null)
				subs[i].download_url = "/api/asset/"+subs[i].asset_pack_id;
			else
				subs[i].download_url = "/api/asset/"+subs[i].asset_pack_id+"/"+subs[i].asset_version_id;
		};
		res.send(200, {success:true, subscriptions:subs})
	});
});
OBG.get('/api/asset/:asset_pack_id/:asset_version_id', function(req, res){
	db.get("SELECT asset_url FROM asset_Version WHERE asset_pack_id='"+req.params.asset_pack_id+"' AND asset_version_id='"+req.params.asset_version_id+"';", function(err, asset){
		if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
		if(asset==undefined){res.send(200, {success:false, error:"no such asset"});}
		res.sendfile(__dirname+asset.asset_url); 
	});
});
OBG.get('/api/asset/:asset_pack_id/', function(req, res){
	db.get("SELECT asset_url FROM asset_Version WHERE asset_pack_id='"+req.params.asset_pack_id+"' ORDER BY version DESC LIMIT 1 ", function(err, asset){
		if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
		if(asset==undefined){res.send(200, {success:false, error:"no such asset"});}
		res.sendfile(__dirname+asset.asset_url); 
	});
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
function mergeUser(user, obj2){
	if(typeof user == 'string') user = JSON.parse(user);
	if(typeof user == 'object'){
		var obj1 = {"user":user};
		for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
		return obj1;
	}
	return obj2;
 }
var authError = function(e, res){
	console.log(e);
	res.redirect("/auth?m="+e);
 }
//Misc End//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
//consructors/////////////////////////////////////////////////////////////////////////////
// server_name, game_name, max_num_players, host_id, ip_address, password
var server = function(options){
	var new_server = {};
	for (var attrname in options)
		new_server[attrname] = options[attrname];
	if(options.server_passphrase==undefined)
		delete new_server.server_passphrase;
	new_server.hash = function(){
		new_server.hashCode = new_server.ip_address.replace(/[.]/g, "_");
		return new_server.hashCode;
	}
	new_server.hash();
	new_server.timeout = undefined;
	new_server.ping = function(options){
		clearTimeout(new_server.timeout);
		for (var attrname in options)
			new_server[attrname] = options[attrname];
		new_server.timeout = setTimeout(function(){
			new_server.remove();
		}, 5000);
	}
	new_server.remove = function(){
		delete serverMap[new_server.hashCode];
		cacheArrayValid = false;
		updateCache();
	}
	return new_server;
 }
var cacheArray = new Array();
var cacheArrayValid = true;
var updateCache = function(callback){
	cacheArray = new Array();
	for(var hash in serverMap)
		cacheArray.push(serverMap[hash]);
	cacheArrayValid = true;
	if(callback!=undefined)
		callback();
}

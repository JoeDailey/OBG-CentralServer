var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

exports.root = function (req, res){
	console.log(req.signedCookies);
	var gitevents = new Array();
	var ass_pks;
	var lock = 0;
	var options = {
		host:"api.github.com",
		path:"/repos/phonyphonecall/AssetGenerator/events?client_id=ec027252dec5d32af078&client_secret=809d41ebea578e9c2b967bcbc0a3286542b724b0",
		headers:{
			"User-Agent":"SurfaceRealms-JoeDailey"
		},
		method: 'GET'
	}
	https.request(options , function(response){
		var data = "";
		response.on('data', function(chunk) {
			data += chunk;
		});
		response.on('end', function() {
			data = JSON.parse(data);
			// console.log(gitevents);
			data.forEach(function (update) {
				if(update.type == "PushEvent")
					gitevents.push(update);
			});
			lock++;
			if(lock>=3){
				sendOff(req, res, gitevents, ass_pks);
			}
		});
	}).end();
	var options = {
		host:"api.github.com",
		path:"/repos/SpexGuy/OnlineBoardGame/events?client_id=ec027252dec5d32af078&client_secret=809d41ebea578e9c2b967bcbc0a3286542b724b0",
		headers:{
			"User-Agent":"SurfaceRealms-JoeDailey"
		},
		method: 'GET'
	}
	https.request(options , function(response){
		var data = "";
		response.on('data', function(chunk) {
			data += chunk;
		});
		response.on('end', function() {
			data = JSON.parse(data);
			data.forEach(function (update) {
				if(update.type == "PushEvent")
					gitevents.push(update);
			});
			lock++;
			if(lock>=3){
				sendOff(req, res, gitevents, ass_pks);
			}
		});
	}).end();
	db.all("SELECT asset_packs.*, img.image_url FROM asset_packs INNER JOIN images AS img ON asset_packs.asset_pack_id=img.asset_pack_id GROUP BY asset_packs.asset_pack_id;", function(err, asses){	
		ass_pks = asses;
		if(err) console.log(err);
		if(ass_pks==undefined || ass_pks.length==0){ 
			ass_pks=new Array()
			lock++;
			if(lock >= 3)
				sendOff(req, res, gitevents, ass_pks)
			return;
		}
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
						lock++;
						if(lock>=3){
							sendOff(req, res, gitevents, ass_pks)
						}
					}
				});
			});
		});
	}); 
 };

var sendOff = function(req, res, gitevents, ass_pks){
	gitevents.sort(function(a, b){
		var keyA = new Date(a.created_at).getTime(),
		keyB = new Date(b.created_at).getTime();
		// Compare the 2 dates
		if(keyA < keyB) return 1;
		if(keyA > keyB) return -1;
		return 0;
	});
	gitevents = gitevents.slice(0,16);
	var totes = 0;
	gitevents.forEach(function(commit){
		commit.date = monthNames[new Date(commit.created_at).getMonth()] + " " + new Date(commit.created_at).getDate() +"'";
			totes++;
			if(totes>=gitevents.length)
				res.render('home', util.mergeUser(req.signedCookies.user, {nav:"Popular", games:ass_pks, updates:gitevents}));
	});
 };

exports.matchmaking = function(req, res){
	console.log(global);
	res.render('servers', util.mergeUser(req.signedCookies.user, {nav:"Servers", servers:serverMap}));
 };

exports.download = function(req, res){
	res.render('download', util.mergeUser(req.signedCookies.user, {nav:"Download"}));
 };

exports.upload = function (req, res){
	if(req.signedCookies.user != undefined)
		res.render('upload', util.mergeUser(req.signedCookies.user, {nav:"upload"}));
	else
		res.redirect("/auth?m=You need and account before you can upload games.");
 };

exports.auth = function(req, res){
	if(req.query.m == undefined)
		if(req.signedCookies.user!=undefined)
			res.render("auth", {nav:"signin", message:"Warning: You are already signed in to "+JSON.parse(req.signedCookies.user).user_name});
		else
			res.render("auth", {nav:"signin"});
	else{
		res.render("auth", {nav:"signin", message:req.query.m});
	}
 };

exports.activate = function(req, res){
	res.render("activate", {nav:""});
 }



exports.ass_pk = function (req, res){
	req.sanitize('asset_pack_id').toString();
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
					res.render('game', util.mergeUser(req.signedCookies.user, {nav:ass_pk.asset_pack_name, game:ass_pk}));
				});
			});	
		});	
	});	
 }
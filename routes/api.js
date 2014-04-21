
exports.unsubscribe = function(req, res){
	console.log("unsub");
	req.sanitize('asset_pk_id').toString();
	var ass = req.body.ass_pk_id;
	if(req.signedCookies.user==undefined){
		res.send(403, {error:"user not signed in", url:"/auth?m=Sign in to subscribe to content!"});
		return;
	}
	user = JSON.parse(req.signedCookies.user);
	db.run("DELETE FROM subscriptions WHERE user_id='"+user.user_id+"' and asset_pack_id='"+ass+"';");
 };

exports.subscribe = function(req, res){
	console.log("sub");
	req.sanitize('asset_pk_id').toString();
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
 };

exports.login = function(req, res){
	if(req.body.email==undefined || req.body.password==undefined){
		res.send(200, {success:false, error:"insufficient data"}); return;
	}

	req.sanitize('email').toString();
	req.sanitize('password').toString();
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
 };

exports.server_start = function(req, res){
	var data = {
		server_name:req.body.server_name,
		game_name:req.body.game_name,
		max_num_players:req.body.max_num_players,
		host_id:req.body.host_id,
		server_passphrase:req.body.server_passphrase,
		ip_address:req.headers['X-Real-IP'] || req.connection.remoteAddress
	}
	if(data.server_name == undefined || data.game_name == undefined || data.max_num_players == undefined || data.host_id == undefined)
		{res.send(200, {success:false, err:"insufficient data"}); return;}

	var new_server = serverTools.new(data);
	serverMap[new_server.hashCode] = new_server;
	serverMap[new_server.hashCode].ping();
	res.send(200, {success:true, gid:new_server.hashCode});
	serverTools.cacheArrayValid = false;
	serverTools.updateCache();
 };

exports.server_heartbeat = function(req, res){
	var pingtime = new Date().getTime() - req.connection._idleStart;
	var gip = req.body.gid;
	var num_players = req.body.num_players;
	var ip = req.connection.remoteAddress;
	if(gip==undefined || num_players==undefined) {res.send(200, {success:false, error:"insufficient data"}); return}
	if(serverMap[gip]!=undefined){
		serverMap[gip].ip_address=ip;
		var hash = serverMap[gip].hash();
		if(hash != gip){
			serverMap[hash] = serverMap[gip];
			delete serverMap[gip];
			serverTools.cacheArrayValid = false;
			serverTools.updateCache();
		}
		serverMap[hash].ping();
		serverMap[hash].num_players = num_players;
		serverMap[hash].pingtime = pingtime;
		res.send(200, {success:true, gip:hash});
	}else{
		res.send(200, {success:false, error:"not started, must ping every 5000ms or less"});
	}
 }

exports.server_info = function(req, res){
	if(serverMap[req.params.serverhash]==undefined){
		res.send(200, {success:false, error:"server does not exist"});
		return;
	}
	res.send(200, {success:true, server:serverMap[serverhash]});
 };

exports.servers = function(req, res){
	if(serverTools.cacheArrayValid)
		res.send(200, {success:true, servers:serverTools.cacheArray});
	else{
		serverTools.updateCache(function(){
			res.send(200, {success:true, servers:serverTools.cacheArray})	
		})
	}
 };

exports.subs = function(req, res){
	var user_id = req.params.user_id;
	db.get("SELECT * FROM users WHERE user_id='"+user_id+"';", function(err, user){
		if(err || user == undefined){res.send(200, {success:false, error:"user does not exist"}); return;}
		db.all("SELECT asset_pack_id, asset_version_id FROM subscriptions WHERE user_id='"+user_id+"';", function(err, subs){
			if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
			if(subs == undefined) {res.send(200, {success:false, error:"user does not exist"}); return;}
			for (var i = 0; i < subs.length; i++) {
				if(subs[i].asset_version_id == null)
					subs[i].download_url = "/api/asset/"+subs[i].asset_pack_id;
				else
					subs[i].download_url = "/api/asset/"+subs[i].asset_pack_id+"/"+subs[i].asset_version_id;
			};
			res.send(200, {success:true, subscriptions:subs});
		});
	});
 };

exports.asset_version_dl = function(req, res){
	db.get("SELECT asset_url FROM asset_Version WHERE asset_pack_id='"+req.params.asset_pack_id+"' AND asset_version_id='"+req.params.asset_version_id+"';", function(err, asset){
		if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
		if(asset==undefined){res.send(200, {success:false, error:"no such asset"}); return;}
		res.sendfile(__dirname+asset.asset_url); 
	});
 };

exports.asset_dl = function(req, res){
	db.get("SELECT asset_url FROM asset_Version WHERE asset_pack_id='"+req.params.asset_pack_id+"' ORDER BY version DESC LIMIT 1 ", function(err, asset){
		if(err){res.send(200, {success:false, error:err}); console.log(err); return;}
		if(asset==undefined){res.send(200, {success:false, error:"no such asset"});}
		res.sendfile(__dirname+asset.asset_url); 
	});
 };

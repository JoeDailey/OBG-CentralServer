
exports.image = function(req, res){
	var image_name = '/static/ass_img/'+uuid.v4().split('-')[0]+"."+req.files.image.originalFilename.split(".")[req.files.image.originalFilename.split(".").length-1];
	fs.rename(req.files.image.path, __dirname + image_name, function(err){console.log(err);});
	db.run('INSERT INTO images (image_url, user_id, asset_pack_id) VALUES("'+image_name+'","' + JSON.parse(req.signedCookies.user).user_id + '","'+ -1 + '");', function (err){
		if(err)
			res.send(500, {url:"static/img/error_img.png"});
		else
			res.send(200, {url:image_name});
	});
 };
 exports.delimage = function(req, res){
	var image_name = __dirname + req.body.image;
	fs.unlink(image_name, function(err){console.log(err);});
	db.run('DELETE FROM images WHERE image_url="'+req.body.image+'";');
	res.send(200, {});
 };

exports.upload = function(req, res){
	var user = JSON.parse(req.signedCookies.user);
	if(user==undefined){res.redirect("/auth?m=You need to log in to upload games."); return}
	
	req.sanitize('ass_name').toString();
	req.sanitize('add_desc').toString();
	req.sanitize('ass_imgs').toString();
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
 };

exports.merge = function(obj1, obj2){
	for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
	return obj1;
 };

exports.mergeUser = function(user, obj2){
	if(user == undefined) return obj2;
	if(typeof user == 'string') user = JSON.parse(user);
	if(typeof user == 'object'){
		var obj1 = {"user":user};
		for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
		return obj1;
	}
	return obj2;
 };

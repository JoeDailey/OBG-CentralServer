exports.signup = function(req, res){
	req.sanitize('email').toString();
	req.sanitize('username').toString();
	req.sanitize('password').toString();
	req.sanitize('confirm').toString();
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
 }

exports.signin = function(req, res){
	req.sanitize('email').toString();
	req.sanitize('password').toString();
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
 };

exports.activate = function(req, res){
	req.sanitize('user_id').toString();
	db.serialize(function(){
		db.run("UPDATE users SET activated='true' WHERE user_id='"+req.params.user_id+"';", function(err){
			res.render("activated", {nav:""});
		});
	});
 };



exports.logout = function(req, res){
	res.clearCookie('user');
	res.redirect('/');
 };

exports.authError = function(e, res){
	console.log(e);
	res.redirect("/auth?m="+e);
 };
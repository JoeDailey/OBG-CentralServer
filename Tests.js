var domain = "localhost";
var tests = 0,
	successful = 0,
	failed = 0;
var http = require("http");
var get = function(path, callback){
	tests++
	var options = {
		hostname:domain,
		port:9001,
		"path":path,
		method:"GET",
		headers: {
        	accept: 'application/json'
    	}
	};
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			try{
				chunk = JSON.parse(chunk);
			}catch(e){
				failed++
				console.log("GET " + path + " failed");
				console.log(e)
			}
			callback(null, chunk, path);
		});
	});

	req.on('error', function(e) {
		failed++;
		console.log("GET " + path + " failed");
		console.log(e);
	});

	req.end();
 }
var post = function(path, data, callback){
	tests++
	// var options = {
	// 	hostname:domain,
	// 	port:9001,
	// 	"path":path,
	// 	method:"POST",
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// 		'Content-Length': data.length
	// 	}
	// };
	// var req = http.request(options, function(res) {
	// 	res.setEncoding('utf8');
	// 	res.on('data', function (chunk) {
	// 		try{
	// 			chunk = JSON.parse(chunk);
	// 		}catch(e){
	// 			failed++;
	// 			console.log("GET " + path + " failed");
	// 			console.log(e)
	// 		}
	// 		callback(null, chunk, path);
	// 	});
	// });

	// req.on('error', function(e) {
	// 	fail(path);
	// 	console.log(e);
	// });
	// req.write(JSON.stringify(data));
	// req.end();

	data = JSON.stringify(data);

	// prepare the header
	var postheaders = {
	    'Content-Type' : 'application/json',
	    'Content-Length' : Buffer.byteLength(data, 'utf8')
	};

	// the post options
	var optionspost = {
	    host : domain,
	    port : 9001,
	    path : path,
	    method : 'POST',
	    headers : postheaders
	};

	// do the POST call
	var reqPost = http.request(optionspost, function(res) {
	    res.on('data', function(d) {
	    	d = JSON.parse(d);
	    	callback(null, d, path);
	    });
	});

	// write the json data
	reqPost.write(data);
	reqPost.end();
	reqPost.on('error', function(e) {
	    fail(path);
	    console.error(e);
	});
}
var success = function(path){
	console.log(path+" success");
	successful++;
 }
var fail = function(path){
	console.log(path+" failed");
	failed++;
 }




//posts
post("/api/login", {"email":"josephldailey@gmail.com", "password":"asdf"}, function(err, data, path){
	if(data.success == true)
		success(path);
	else
		fail(path);
 });
post("/api/login", {"email":"asdfphldailey@gmail.com", "password":"asdf"}, function(err, data, path){
	if(data.success == false)
		success(path);
	else
		fail(path);
 });
post("/api/login", {"email":"josephldailey@gmail.com", "password":"as123df"}, function(err, data, path){
	if(data.success == false)
		success(path);
	else
		fail(path);
 });

post("/api/server_start", {server_name:"The Server", game_name:"The game of Life", max_num_players:8, host_id:1}, function(err, data, path){
	if(data.success == true){
		success(path);
		console.log(data.gid);
		post("/api/server_heartbeat", {gid:data.gid, num_players:5}, function(err, data, path){
			if(data.success == true)
				success(path);
			else
				fail(path);
		});
		tests++;
		setTimeout(function(){
			tests--;
			post("/api/server_heartbeat", {gid:data.gid, num_players:5}, function(err, data, path){
				if(data.success == false)
					success(path);
				else
					fail(path)
			});
		}, 8000);
	}else{
		fail(path);
	}
 });

post("/api/server_heartbeat", {gid:"1234", num_players:-1}, function(err, data, path){
	if(data.success==false){
		success(path);
		console.log("Asdf");
	}
	else{

		console.log("qwer");
		fail(path);
	}
});
//gets
get("/api/subs/-1", function(err, data, path){
	if(data.success == false){
		success(path);
	}else{
		fail(path);
	}
 });
get("/api/server/1234", function(err, data, path){
	if(data.success == false){
		success(path);
	}else{
		fail(path);
	}
 });
get("/api/subs/1", function(err, data, path){
	if(data.success == true){
		if(data.subscriptions.length >= 1){
			success(path);
		}else{
			fail(path);
		}
	}else{
		fail(path);
	}
 });
get("/api/server/asdf", function(err, data, path){
	if(data.success == false)
		success(path);
	else
		fail(path);
 });
get("/api/asset/asdf", function(err, data, path){
	if(data.success == false)
		success(path);
	else
		fail(path);
 });
get("/api/asset/asdf/10", function(err, data, path){
	if(data.success == false)
		success(path);
	else
		fail(path);
 });



setInterval(function(){
	if(successful+failed >= tests){
		console.log("success: " + successful + "/" + tests);
		console.log("fail: " + failed + "/" + tests);
		process.exit();
	}
}, 100)
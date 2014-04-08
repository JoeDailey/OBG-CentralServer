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
var success = function(path){
	console.log("GET "+path+" success");
	successful++;
 }
var fail = function(path){
	console.log("GET "+path+" failed");
	failed++;
 }


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


setInterval(function(){
	if(successful+failed >= tests){
		console.log("success: " + successful + "/" + tests);
		console.log("fail: " + failed + "/" + tests);
		process.exit();
	}
}, 100)
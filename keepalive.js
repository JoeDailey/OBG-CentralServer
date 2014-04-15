var http = require('http');
// the post options

{
	var data = JSON.stringify({server_name:"The best server", max_num_players:8, game_name:'life', host_id:1, server_passphrase:"asdf"});

	// prepare the header
	var postheaders = {
	    'Content-Type' : 'application/json',
	    'Content-Length' : Buffer.byteLength(data, 'utf8')
	};
	var optionspost = {
	    host : "localhost",
	    port : 9001,
	    path : "/api/server_start",
	    method : 'POST',
	    headers : postheaders
	};

	// do the POST call
	var reqPost = http.request(optionspost, function(res) {
	    res.on('data', function(d) {
	    	d = JSON.parse(d);
	    	console.log(d.success);
	    });
	});
	// write the json data
	reqPost.write(data);
	reqPost.end();
	reqPost.on('error', function(e) {
   		console.error(e);
	});

}
setInterval(function(){
	var data = JSON.stringify({gid:"127_0_0_1", num_players:3});

	// prepare the header
	var postheaders = {
	    'Content-Type' : 'application/json',
	    'Content-Length' : Buffer.byteLength(data, 'utf8')
	};
	var optionspost = {
	    host : "localhost",
	    port : 9001,
	    path : "/api/server_heartbeat",
	    method : 'POST',
	    headers : postheaders
	};

	// do the POST call
	var reqPost = http.request(optionspost, function(res) {
	    res.on('data', function(d) {
	    	d = JSON.parse(d);
	    	console.log(d.success);
	    	if(!d.success){
	    		try{
					var data = JSON.stringify({server_name:"The best server", max_num_players:8, game_name:'life', host_id:1, server_passphrase:"asdf"});

					// prepare the header
					var postheaders = {
					    'Content-Type' : 'application/json',
					    'Content-Length' : Buffer.byteLength(data, 'utf8')
					};
					var optionspost = {
					    host : "localhost",
					    port : 9001,
					    path : "/api/server_start",
					    method : 'POST',
					    headers : postheaders
					};

					// do the POST call 
					var reqPost = http.request(optionspost, function(res) {
					    res.on('data', function(d) {
					    	d = JSON.parse(d);
					    	console.log(d.success);
					    });
			 		});
					// write the json data
					reqPost.write(data);
					reqPost.end();
					reqPost.on('error', function(e) {
				   		console.error(e);
					});
				}catch(e){}
	    	}
	    });
	});

	// write the json data
	reqPost.write(data);
	reqPost.end();
	reqPost.on('error', function(e) {
		try{
			var data = JSON.stringify({server_name:"The best server", max_num_players:8, game_name:'life', host_id:1, server_passphrase:"asdf"});

			// prepare the header
			var postheaders = {
			    'Content-Type' : 'application/json',
			    'Content-Length' : Buffer.byteLength(data, 'utf8')
			};
			var optionspost = {
			    host : "localhost",
			    port : 9001,
			    path : "/api/server_start",
			    method : 'POST',
			    headers : postheaders
			};

			// do the POST call
			var reqPost = http.request(optionspost, function(res) {
			    res.on('data', function(d) {
			    	d = JSON.parse(d);
			    	console.log(d.success);
			    });
	 		});
			// write the json data
			reqPost.write(data);
			reqPost.end();
			reqPost.on('error', function(e) {
		   		console.error(e);
			});
		}catch(e){}

	});
}, 300);
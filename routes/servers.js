global.serverTools = {};
//hash object for all the servers
global.serverMap = {};

//create a new server entity 
serverTools.new = function(options){
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
			serverTools.updateCache();
		}, 5000);
	}
	new_server.remove = function(){
		delete serverMap[new_server.hashCode];
		serverTools.cacheArrayValid = false;
		serverTools.updateCache();
	}
	return new_server;
 }
//instead of creating an array from an object, keep it cached 
serverTools.cacheArray = new Array();

//dirty bit
serverTools.cacheArrayValid = true;

//recreate the cache
serverTools.updateCache = function(callback){
	serverTools.cacheArray = new Array();
	for(var hash in serverMap)
		serverTools.cacheArray.push(serverMap[hash]);
	serverTools.cacheArrayValid = true;
	if(callback!=undefined)
		callback();
 }
POSTs
=================

/api/login
--------------
```
body:
	email
	password
result:
	{success:true, "user":user}
	{success:false, error:"email doesn't exist"}
	{success:false, error:"not activated"}
	{success:false, error:"insufficient data"}
	{success:false, error:err} //unexpected error
```

/api/server_start
--------------
```
body:
	server_name
	game_name
	max_num_players
	host_id
	server_passphrase //undefined if open server
result:
	{success:true, gid:hash_id);
	{success:false, error:err);
```

/api/server_heartbeat
--------------
```
body:
	gip //is hash_id from start
	num_players
result:
	{success:true, gip:hash}
	{success:false, error:"insufficient data"}
	{success:false, error:"not started, must ping every 5000ms or less"}
```

GETs
=================
/api/subs
--------------
```
query params:
	user_id //is stored from login
result:
	{success:true, subscriptions:subs}
	{success:false, error:err}
```

/api/server/:hash_id
--------------
```
result:
	{success:true, server:serverinfo}
	{success:false, error:"server does not exist"}
```

/api/servers
--------------
```
result:
	{success:true, servers:ArrayOfServers}
```

/api/asset/:asset_pack_id/
--------------
```
result:
	file stream
	{success:false, error:"no such asset"}
	{success:false, error:err}
```

/api/asset/:asset_pack_id/:asset_version_id
--------------
```
result:
	file stream
	{success:false, error:"no such asset with version"}
	{success:false, error:err}
```

Objects
=================

subscriptions
--------------
without version specification
```
"asset_pack_id": "4c96fa0a",
"asset_version_id": null,
"download_url": "/api/asset/4c96fa0a"
```
with
```
"asset_pack_id": "4c96fa0a",
"asset_version_id": 1234,
"download_url": "/api/asset/4c96fa0a/1234"
```

user
--------------
```
user_id": 1,
"user_email": "josephldailey@gmail.com",
"user_name": "JoeDailey",
"activated": "true",
"created_at": "2014-03-26 05:31:19"
```

hash
--------------
The server hash id is the result of replaceing the dots (.) in the ip with underscores (_)
```
ip:123.456.789.10 --> hash:123_456_789_10
```
This is used in the hash table (simple javascript object) and is set/returned from the inital `/api/server_Start` ip and is supplied to all heartbeats. If the ip of the heartbeat is no longer the same as the supplied hash, the server host will be considered migrated and the central server will update the hash to the new ip and return the new hash.

**Make sure you store this has after each heartbeat or your heartbeat will seem timed out as the old has is useless or pointing to a different player.**
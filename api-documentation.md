/api/login
body
email
password
Result body
success: {true, false}
sid: <hex key for the session id>
/api/register
body
email
password
username
Result
success: {true, false}
sid: <hex key for the session id>
/api/logout
body
sid: <hex key for the session id>
Result
user logged out successfully (session id invalidated)
	/api/server_start
body
max_num_players: <int>
game_name: <String>
server_name: <String>
Result
gid: <hex key for the game id>
	/api/server_heartbeat
body
gid: <hex key for the game id>
num_players: <integer representing number of players on server>
Result
success: {true, false}
GET methods
	/api/subs/
		body
			sid: <hex key for the session id>
		Result
			[{	
			asset_name:”name”,
			current_version:0
			download_url:”url”
			}]
		403 user not logged in

	/api/asset/:name/:version
	/api/asset/:name/  - for current version
		body
			sid: <hex key for the session id>
			Result
			200: pack.aspk
			404: asset pack not found

- remove votes count : timeout per trackid in session (longer)
- room creation (fuck code choosing, just impose it)
- player page, with links to app and code along with player
- debugging :(
- track directive? (for voting on the search page)
- analytics (at least a little)
- demo room for testing design (random adds in cron)


Backend Architecture

  Redis (metal)
         ^
         |
Models (room, user, track)


TrackTTL <- track

RoomCreation <- room

Playlist <- room / track

Socket <- user / playlist



NOTE : User this coffee  : https://github.com/alubbe/coffee-script/ (npm install -g alubbe/coffee-script)


 + force client reload (and log) on server errors



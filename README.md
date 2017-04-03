# celebrity-server
Backend server for the celebrity game

## Local dev setup

Launch containers in docker:

`$ docker-compose -f docker-compose up -d`

Start gulp `watch-test` task:

`$ gulp watch-test`

## API Documentation

`POST /games` ~> Create a new game

`POST /join` ~> Join a game
_body: short id_

`POST /celebrity` ~> Add a celebrity to the game
_header: player id_

`PUT /game/start` ~> Starts the game
_header: game id_
- status changed to 'roundOne'
- players are grouped into teams and arranged in a turn order

`GET /game` ~> Get the current status (stage, turns, status) for the game
_header: game id_
- returns teams and players
- returns the list of celebrities in the game
- returns the score for each team by round (calculated by summing the number of 'right' answers in turns belonging to players from that team), along with the current total score
- returns the game status new | roundOne | roundTwo | roundThree | finished

`GET /game/next` ~> Get the next player's turn
_header: game id_
- based on the game's status and the last team to go, and the last person to go from the other team, chooses the next person
- returns that person again until their turn has expired

`POST /turns` ~> Start a turn
_header: player id_
- creates a new turn for the player in that round of the game and returns the first celebrity
- sets the turn to expire in 60 seconds after having begun

`PUT /turns` ~> Add a score to a turn
- Updates the celebrity with either a 'right' or a 'skip' score
- Randomly returns the next celebrity out of the remaining celebrities for the round that have not been marked as 'wright' in a turn
- Returns a 400 error if the player has already skipped twice during that turn
- Returns a 401 error if the time limit for the turn has finished

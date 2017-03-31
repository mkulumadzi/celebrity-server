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

`POST /celebrity` ~> Add a celebrity to the game

`POST /game/start` ~> Start the game

`GET /game` ~> Get the current status (stage, turns, status) for the game

`GET /game/next` ~> Get the next player's turn

`POST /turns/<id>/start` ~> Start a turn

`POST /turns/<id>/celebrity` ~> Record the score (right or wrong) for a celebrity on a turn

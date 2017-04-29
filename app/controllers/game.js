const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Game = require('../models/game')
  , Celebrity = require('../models/celebrity')
  , Player = require('../models/player')
  , Team = require('../models/team')
  , errors = require('restify-errors')
  , shuffle = require('shuffle-array')
  , splitArray = require('split-array');

var GamesCtrl = function( server, opts ){

  var game = restifyMongoose(Game);

  server.get( '/games', game.query());
  server.get('/games/:id', game.detail());
  server.post( '/games', this.createGame );
  server.put( '/game/start', this.startGame );
  server.get( '/game', this.getGame );
  server.get( '/game/next', this.getNextPlayer );

}

module.exports = GamesCtrl;


// Create a game

GamesCtrl.prototype.createGame = function (req, res, next) {

  var game = new Game( { 'shortId': shortId(), status: 'new' } );
  game.save( function(err, game) {
    if (err) {
      return next(err);
    }
    res.send( 201, game );
    return next();
  })

}

var shortId = function() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}


// Start a game

GamesCtrl.prototype.startGame = function (req, res, next) {
  findGame( req, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      validateGameToStart( game, function( err, game) {
        if ( err ) {
          return next ( err );
        } else {
          game.start( function( err, game ) {
            if ( err ) {
              return next( err );
            } else {
              res.send( 201, game );
              return next();
            }
          });
        }
      });
    }
  });
}

var findGame = function( req, cb ) {
  if (!req.header('Authorization')){
    return cb(new errors.UnauthorizedError("Authorization token required"));
  } else {
    gameId = req.header('Authorization').split(' ')[1];
    Game.findOne({'_id': gameId }, function( err, game ) {
      if(err) {
        return cb(new errors.BadRequestError(err.message));
      } else if (!game) {
        return cb(new errors.UnauthorizedError("Invalid token"));
      } else {
        return cb( null, game );
      }
    })
  }
}

var validateGameToStart = function( game, cb ) {
  if ( game.status !== "new" ) {
    return cb( new errors.BadRequestError("Only new games can be started"));
  } else {
    Player.count({"game": game._id}, function(err, count) {
      if( err ) {
        return cb( err );
      } else if (count < 4 ) {
        return cb( new errors.BadRequestError("Games must have at least 4 players"));
      } else {
        if ( game.celebrities.length < 20 ) {
          return cb( new errors.BadRequestError("Games must have at least 20 celebrities"));
        } else {
          return cb( null, game );
        }
      }
    });
  }
}


// Get a game, converting it to an object and
GamesCtrl.prototype.getGame = function (req, res, next) {
  findGame( req, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      Game
        .findOne({_id: game._id })
        .populate({
          path: 'players teamA teamB celebrities roundOne roundTwo roundThree'
          , select: 'name players attempts team player'
        })
        .exec(function (err, game) {
          if ( err ) {
            return next( err );
          } else {
            if ( game.status === "new" ) {
              res.send( 200, game );
              return next();
            }
            var gameObject = game.toObject();
            // There has got to be a way to make score a calculated field that gets included in the object when it gets queried and returned in the populate statement
            Team.findOne( game.teamA._id, function( err, teamA ) {
              if ( err ) {
                return next( err );
              } else {
                teamA.currentScore( function( err, teamAScore ) {
                  if ( err ) {
                    return next( err );
                  } else {
                    gameObject.teamA.score = teamAScore;
                    Team.findOne( game.teamB._id, function( err, teamB ) {
                      if ( err ) {
                        return next( err );
                      } else {
                        teamB.currentScore( function( err, teamBScore ) {
                          if ( err ) {
                            return next( err );
                          } else {
                            gameObject.teamB.score = teamBScore;
                            res.send( 200, gameObject );
                            return next();
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
    }
  });
}

//Get next player for a game
GamesCtrl.prototype.getNextPlayer = function( req, res, next) {
  findGame( req, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      game.nextPlayer( function( err, nextPlayer) {
        if ( err ) {
          return next( err );
        } else {
          Player
            .findOne({_id: nextPlayer })
            .populate({
              path: 'team'
              , select: 'name'
            })
            .exec(function (err, player) {
              if ( err ) {
                return next( err );
              } else {
                res.send( 200, player );
                return next();
              }
            });
        }
      });
    }
  });
}

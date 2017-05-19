const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Player = require('../models/player')
  , Game = require('../models/game')
  , Turn = require('../models/turn')
  , Team = require('../models/team')
  , Celebrity = require('../models/celebrity')
  , errors = require('restify-errors')
  , server = require('../server')
  , moment = require('moment')
  , io = server.io;

var PlayersCtrl = function( server, opts ){
  server.post( '/join', this.joinGame );
  server.get( '/player', this.getPlayer );
}

module.exports = PlayersCtrl;

PlayersCtrl.prototype.joinGame = function ( req, res, next) {

  var name = req.body.name;
  var shortId = req.body.shortId;
  validateGame( shortId, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      validateNewPlayer( name, game, function(err) {
        if ( err ) {
          return next(err);
        } else {
          createPlayer( name, game, function( err, player ) {
            if ( err ) {
              return next(err);
            } else {
              server.io.to(game._id).emit('player joined', player);
              newGamePlayerDetails( player, game, function( err, playerObject ) {
                if ( err ) {
                  next( err );
                } else {
                  res.send(201, playerObject);
                  return next();
                }
              });
            }
          });
        }
      });
    }
  });

};

PlayersCtrl.prototype.getPlayer = function ( req, res, next) {
  validatePlayer( req, function( err, player, game ) {
    if ( err ) {
      next( err );
    } else {
      if ( game.phase === "new" ) {
        newGamePlayerDetails( player, game, function( err, playerObject ) {
          if ( err ) {
            next( err );
          } else {
            res.send(200, playerObject);
            return next();
          }
        });
      } else {
        playingGamePlayerDetails( player, game, function( err, playerObject) {
          if ( err ) {
            next( err );
          } else {
            res.send(200, playerObject);
            return next();
          }
        });
      }
    }
  });
};

var newGamePlayerDetails = function( player, game, cb ) {
  var playerObject = player.toObject();
  playerObject.game = game;
  Celebrity.find({addedBy: player._id}, function( err, celebrities) {
    if ( err ) {
      cb( err );
    } else {
      playerObject.celebrities = celebrities
      cb( null, playerObject );
    }
  });
}

var playingGamePlayerDetails = function( player, game, cb) {
  var playerObject = player.toObject();
  game.details( function( err, details ) {
    if ( err ) {
      cb( err );
    } else {
      playerObject.game = details;
      Team.findOne({_id: playerObject.team}, function( err, team) {
        if ( err ) {
          cb( err );
        } else {
          playerObject.teamName = team.name;
          game.nextPlayer( function( err, nextPlayer ) {
            if ( err ) {
              cb( err );
            } else if ( !nextPlayer || nextPlayer._id != playerObject._id.toString() ) { // It is not the player's turn
              playerObject.status = 0;
              cb( null, playerObject);
            } else if ( !nextPlayer.turn ) { // It's the player's turn but they haven't started yet
              playerObject.status = 1;
              cb( null, playerObject);
            } else {  // The player's turn is in progress
              Turn.findOne({_id: nextPlayer.turn._id})
              .populate({
                path: 'attempts.celebrity'
              })
              .exec(function( err, turn ) {
                playerObject.turn = turn.toObject();
                playerObject.status = 2;
                playerObject.turn.celebrity = turn.attempts.pop().celebrity;
                playerObject.turn.timeRemaining = turn.timeRemaining();
                cb( null, playerObject);
              })
            }
          });
        }
      });
    }
  });
}

var validateGame = function( shortId, cb ) {
  Game.findOne({ 'shortId': shortId }, function (err, game) {
    if ( !game ) {
      return cb(new errors.BadRequestError("A valid shortId is required", null));
    } else if ( game.phase !== "new" ) {
      return cb(new errors.BadRequestError("Only new games may be joined", null));
    } else if ( err ) {
      return cb(err, null);
    }  else {
      return cb( null, game );
    }
  });
}

var validateNewPlayer = function( name, game, cb ) {
  Player.findOne({ 'game': game._id, 'name': name}, function(err, existingPlayer) {
    if ( existingPlayer ) {
      var message = name + " has already joined the game"
      return cb(new errors.BadRequestError(message));
    } else Player.count({ game: game._id}, function(err, count) {
      if(err) {
        return cb(err);
      } else if (count >= 8) {
        return cb(new errors.BadRequestError("Sorry, the game is full!"));
      } else {
        return cb();
      }
    });
  });
}

var createPlayer = function( name, game, cb ) {
  game.addPlayer( name, function( err, player ) {
    if (err) {
      return cb(new errors.BadRequestError(err.message), null);
    } else {
      game.save();
      return cb(null, player);
    }
  });
}

var validatePlayer = function( req, cb ) {
  if (!req.header('Authorization')){
    return cb(new errors.UnauthorizedError("Authorization token required"));
  } else {
    playerId = req.header('Authorization').split(' ')[1];
    Player.findOne({_id: playerId }, function(err, player) {
      if(err) {
        return cb(new errors.BadRequestError(err.message));
      } else {
        Game.findOne({_id: player.game}, function(err, game) {
          if(err) {
            return cb(new errors.BadRequestError(err.message));
          } else {
            return cb( null, player, game );
          }
        });
      }
    })
  }
}

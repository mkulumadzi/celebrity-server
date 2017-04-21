const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , moment = require('moment')
  , Turn = require('../models/turn')
  , Celebrity = require('../models/celebrity')
  , Player = require('../models/player')
  , Game = require('../models/game')
  , Attempt = Turn.Attempt
  , errors = require('restify-errors');

var TurnCtrl = function( server, opts ){
  server.post( '/turns', this.startTurn );
  server.put( '/turns/:id', this.addAttempt );
}

module.exports = TurnCtrl;

TurnCtrl.prototype.startTurn = function( req, res, next) {
  validatePlayer( req, function( err, player, game ) {
    if ( err ) {
      next( err );
    } else {
      Turn.startTurn(player, game, function( err, turn, celebrity ) {
        if ( err ) {
          next( err );
        } else {
          var turnObject = turn.toObject();
          turnObject.celebrity = { _id: celebrity.id, name: celebrity.name};
          res.send(201, turnObject);
          return next();
        }
      });
    }
  });
}

TurnCtrl.prototype.addAttempt = function( req, res, next) {
  Turn.findOne({_id: req.params.id}, function( err, turn) {
    if ( err ) {
      next( err );
    } else if ( turn.expiresAt <= moment() ) {
      next( new errors.UnauthorizedError("The turn has expired.") );
    } else {
      playerId = req.header('Authorization').split(' ')[1];
      if (playerId != turn.player ) {
        next( new errors.BadRequestError("It is not this player's turn") );
      } else {
        Game.findOne({_id: turn.game}, function( err, game ) {
          if ( err ) {
            next( err );
          } else {
            turn.addAttempt( game, req.body, function( err, turn, celebrity) {
              if ( err ) {
                next( err );
              } else if (celebrity) {
                var turnObject = turn.toObject();
                turnObject.celebrity = { _id: celebrity.id, name: celebrity.name};
                res.send(200, turnObject);
                return next();
              } else {
                res.send(200, turn);
                return next();
              }
            });
          }
        });
      }
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
            game.nextPlayer( function( err, nextPlayer ) {
              if(err) {
                return cb(new errors.BadRequestError(err.message));
              } else {
                if ( player._id.equals(nextPlayer._id) ) {
                  return cb( null, player, game );
                } else {
                  return cb(new errors.BadRequestError("It is not this player's turn"));
                }
              }
            });
          }
        });
      }
    })
  }
}

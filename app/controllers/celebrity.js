const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Celebrity = require('../models/celebrity')
  , Player = require('../models/player')
  , Game = require('../models/game')
  , errors = require('restify-errors')
  , server = require('../server');

var CelebrityCtrl = function( server, opts ){
  server.post( '/celebrity', this.addCelebrity );
}

module.exports = CelebrityCtrl;

CelebrityCtrl.prototype.addCelebrity = function (req, res, next) {
  var name = req.body.name;
  validatePlayer( req, function( err, player) {
    if ( err ) {
      return next( err );
    } else {
      validateGame( player, function( err, game) {
        if ( err ) {
          return next( err );
        } else {
          game.addCelebrity( player, name, function( err, celebrity) {
            if ( err ) {
              return next(new errors.BadRequestError(err.message));
            } else {
              game.save();
              server.io.to(game._id).emit('celebrity added', celebrity);
              res.send(201, celebrity);
              return next();
            }
          });
        }
      });
    }
  });
}

var validatePlayer = function( req, cb ) {
  if (!req.header('Authorization')){
    return cb(new errors.UnauthorizedError("Authorization token required"));
  } else {
    playerId = req.header('Authorization').split(' ')[1];
    Player.findOne({'_id': playerId }, function(err, player) {
      if(err) {
        return cb(new errors.BadRequestError(err.message));
      } else if (!player) {
        return cb(new errors.UnauthorizedError("Invalid token"));
      } else {
        Celebrity.count({ addedBy: player._id }, function(err, count) {
          if (err) {
            return cb(err);
          } else if (count >= 5 ) {
            message = player.name + " has already added 5 celebrities - that's the max per player."
            return cb( new errors.BadRequestError( message ));
          } else {
            return cb( null, player );
          }
        })
      }
    })
  }
}

var validateGame = function( player, cb ) {
  Game.findOne({'_id': player.game }, function(err, game){
    if(err) {
      return cb(new errors.BadRequestError(err.message));
    } else {
      return cb( null, game );
    }
  });
}

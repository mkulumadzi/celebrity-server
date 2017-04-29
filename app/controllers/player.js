const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Player = require('../models/player')
  , Game = require('../models/game')
  , errors = require('restify-errors')
  , server = require('../server');

var PlayersCtrl = function( server, opts ){
  server.post( '/join', this.joinGame );
}

module.exports = PlayersCtrl;

PlayersCtrl.prototype.joinGame = function ( req, res, next) {

  var name = req.body.name;
  var shortId = req.body.shortId;
  validateGame( shortId, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      validatePlayer( name, game, function(err) {
        if ( err ) {
          return next(err);
        } else {
          createPlayer( name, game, function( err, player ) {
            if ( err ) {
              return next(err);
            } else {
              server.io.to(game._id).emit('player joined', player);
              res.send( 201, player);
              return next();
            }
          });
        }
      });
    }
  });

};

var validateGame = function( shortId, cb ) {
  Game.findOne({ 'shortId': shortId }, function (err, game) {
    if ( !game ) {
      return cb(new errors.BadRequestError("A valid shortId is required", null));
    } else if ( game.status !== "new" ) {
      return cb(new errors.BadRequestError("Only new games may be joined", null));
    } else if ( err ) {
      return cb(err, null);
    }  else {
      return cb( null, game );
    }
  });
}

var validatePlayer = function( name, game, cb ) {
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

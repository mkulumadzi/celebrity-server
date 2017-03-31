const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Game = require('../models/game')
  , Celebrity = require('../models/celebrity')
  , Player = require('../models/player')
  , errors = require('restify-errors');

var GamesCtrl = function( server, opts ){

  var game = restifyMongoose(Game);

  server.get( '/games', game.query());
  server.get('/games/:id', game.detail());
  server.post( '/games', this.createGame );
  server.post( '/game/start', this.startGame );

}

module.exports = GamesCtrl;


// Create a game

GamesCtrl.prototype.createGame = function (req, res, next) {

  var game = new Game( { 'shortId': shortId(), status: 'new' } );
  game.save( function(err, game) {
    if (err) {
      console.log('Error creating game: %s', err.message);
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
          game.update( { "status": "started"}, function( err, updated ) {
            if ( err ) {
              return next ( err );
            } else {
              res.send( 204 );
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
        Celebrity.count({"game": game._id}, function(err, count) {
          if( err ) {
            return cb( err );
          } else if (count < 20 ) {
            return cb( new errors.BadRequestError("Games must have at least 20 celebrities"));
          } else {
            return cb( null, game );
          }
        });
      }
    });
  }
}

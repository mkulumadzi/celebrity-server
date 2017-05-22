const C = require('config')
  , mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Game = require('../models/game')
  , Celebrity = require('../models/celebrity')
  , Player = require('../models/player')
  , Team = require('../models/team')
  , errors = require('restify-errors')
  , shuffle = require('shuffle-array')
  , splitArray = require('split-array')
  , server = require('../server');

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

  var game = new Game( { 'shortId': shortId(), phase: 'new' } );
  game.save( function(err, game) {
    if (err) {
      return next(err);
    }
    var gameObject = game.toObject();
    gameObject.joinUrl = "http://" + C.Server.web_host + "/join/" + game.shortId;
    res.send( 201, gameObject );
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
              server.io.to(game._id).emit('game started');
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
  if ( game.phase !== "new" ) {
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


// Get a game, converting it to an object and returning details
GamesCtrl.prototype.getGame = function (req, res, next) {
  if( req.params.shortId) {
    Game.findOne({shortId: req.params.shortId}, function ( err, game) {
      if ( err ) {
        return next( err );
      } else if (game) {
        game.details( function( err, game) {
          if ( err ) {
            return next( err );
          } else {
            res.send( 200, game );
            return next();
          }
        });
      } else {
        return next( new errors.BadRequestError("Game not found for Short Code: " + req.params.shortId));
      }
    });
  } else {
    findGame( req, function( err, game ) {
      if ( err ) {
        return next( err );
      } else {
        game.details( function( err, game) {
          if ( err ) {
            return next( err );
          } else {
            res.send( 200, game );
            return next();
          }
        });
      }
    });
  }
}

//Get next player for a game
GamesCtrl.prototype.getNextPlayer = function( req, res, next) {
  findGame( req, function( err, game ) {
    if ( err ) {
      return next( err );
    } else {
      game.nextPlayer( function( err, player) {
        if ( err ) {
          return next( err );
        } else {
          server.io.to(player._id).emit('your turn');
          res.send( 200, player );
          return next();
        }
      });
    }
  });
}

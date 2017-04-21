const faker = require('faker')
  , lodash = require('lodash')
  , Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity')
  , Turn = require('../../app/models/turn');

var Seeds = function() { }

module.exports = Seeds;

Seeds.prototype.createNewGame = function( cb ) {
  createGame( function( err, game) {
    if ( err ) { cb( err ); }
    addPlayersAndCelebrities( game, function( err ) {
      if ( err ) { cb( err ); }
      game.save(); // Game is not saved while adding celebrities because async calls save celebrities more than once.
      cb( null, game);
    });
  });
}

var createGame = function( cb ) {
  Game.create({shortId: "ABCD", status: "new" }, function( err, game) {
    if ( err ) { cb( err ); }
    cb( null, game );
  });
}

var addPlayersAndCelebrities = function( game, cb ) {
  players = [0, 1, 2, 3];
  async.each( players, function( player, cb) {
    game.addPlayer( faker.name.findName(), function( err, player) {
      if ( err ) { cb( err ); }
      addCelebrities( game, player, function( err ){
        if ( err ) { cb( err ); }
        cb();
      });
    });
  }, function(){
    cb();
  });
}

var addCelebrities = function( game, player, cb ) {
  celebrities = [0, 1, 2, 3, 4];
  async.each( celebrities, function( celebrity, cb) {
    game.addCelebrity( player, faker.name.findName(), function( err, celebrity) {
      if ( err ) { cb( err ); }
      cb();
    });
  }, function() {
    cb();
  });
}

Seeds.prototype.playNTurns = function( game, n, doRight, doWrong, cb ) {
  async.eachSeries(lodash.range(n), function(i, cb) {
    playTurn( game, doRight, doWrong, function( err, turn) {
      if (err) { cb(err); }
      cb();
    });
  }, function( err) {
    if (err) { cb(err); }
    cb(null, game);
  });
}

var playTurn = function( game, doRight, doWrong, cb) {
  game.nextPlayer( function( err, player ) {
    if ( err ) { cb( err ); }
    Turn.startTurn( player, game, function( err, turn, celebrity ){
      if ( err ) {
        cb( err );
      } else {
        game.remainingCelebritiesInRound( function( err, celebrities) {
          if ( err ) {
            cb( err );
          } else {
            var rightCelebrities = celebrities.slice(0,doRight);
            var wrongCelebrities = celebrities.slice(doRight, (doRight + doWrong) );
            async.eachSeries(rightCelebrities, function(celebrity, cb) {
              var attempt = { celebrity: celebrity._id, correct: true }
              turn.addAttempt( game, attempt, function(err, turnObject) {
                if ( err ) {
                  cb(err);
                } else {
                  cb();
                }
              })
            }, function( err ) {
              if ( err ) {
                cb(err);
              } else {
                async.eachSeries(wrongCelebrities, function(celebrity, cb) {
                  var attempt = { celebrity: celebrity._id, correct: false }
                  turn.addAttempt( game, attempt, function(err, turnObject) {
                    if ( err ) {
                      cb(err);
                    } else {
                      cb();
                    }
                  })
                }, function( err ) {
                  cb();
                });
              }
            });
          }
        });
      }
    });
  });
}



module.exports.createNewGame = Seeds.prototype.createNewGame;
module.exports.playNTurns = Seeds.prototype.playNTurns;

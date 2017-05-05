const Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity')
  , Turn = require('../../app/models/turn')
  , seeds = require('../db/seeds')
  , timekeeper = require('timekeeper')
  , moment = require('moment');

  describe('game details', function() {

    before( function(done) {
      seeds.createNewGame( function( err, g ){
        game = g;
        game.start( function( err, game ){
          should.not.exist(err);
          done();
        });
      });
    });

    it('returns the game details', function(done) {
      game.details( function( err, game ) {
        should.not.exist(err);
        should.exist(game.teamA.players[0].name);
        should.exist(game.celebrities[0].name);
        done();
      });
    });

    it('should show the score', function(done) {
      seeds.playNTurns( game, 4, 2, 1, function( err, game) {
        should.not.exist(err);
        game.details( function( err, game ) {
          should.not.exist(err);
          should.exist(game.roundOne[0].attempts[0].celebrity);
          should.exist(game.roundOne[0].attempts[0].correct);
          should.exist(game.teamA.score);
          should.exist(game.teamB.score);
          done();
        });
      });
    });

  })

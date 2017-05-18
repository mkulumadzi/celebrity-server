const Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity')
  , Turn = require('../../app/models/turn')
  , seeds = require('../db/seeds')
  , timekeeper = require('timekeeper')
  , moment = require('moment');

  describe('game details', function() {

    var game;

    before( function(done) {
      seeds.createNewGame( function( err, res ){
        should.not.exist(err);
        game = res;
        game.start( function( err, res ){
          should.not.exist(err);
          done();
        });
      });
    });

    it('returns the game details', function(done) {
      Game.findOne({_id: game._id}, function( err, game ) {
        should.not.exist(err);
        game.details( function( err, game ) {
          should.not.exist(err);
          game.teamA.players.length.should.equal(2);
          should.exist(game.teamA.players[0].name);
          game.celebrities.length.should.equal(20);
          should.exist(game.celebrities[0].name);
          should.exist(game.nextPlayer);
          game.status.should.equal(1);
          done();
        });
      });
    });

    it('should show the score', function(done) {
      Game.findOne({_id: game._id}, function( err, game ) {
        should.not.exist(err);
        seeds.playNTurns( game, 4, 2, 1, function( err, game) {
          should.not.exist(err);
          game.details( function( err, game ) {
            should.not.exist(err);
            should.exist(game.roundOne[0].attempts[0].celebrity);
            should.exist(game.roundOne[0].attempts[0].correct);
            should.exist(game.teamA.score);
            should.exist(game.teamB.score);
            should.exist(game.teamA.scoreSummary);
            should.exist(game.teamB.scoreSummary);
            done();
          });
        });
      });
    });

    it('should return details at the end of the game.', function(done) {
      Game.findOne({_id: game._id}, function( err, game ) {
        should.not.exist(err);
        seeds.playNTurns( game, 3, 20, 0, function( err, game) {
          should.not.exist(err);
          game.details( function( err, game ) {
            should.not.exist(err);
            should.exist(game.roundOne[0].attempts[0].celebrity);
            should.exist(game.roundOne[0].attempts[0].correct);
            should.exist(game.teamA.score);
            should.exist(game.teamB.score);
            should.exist(game.teamA.scoreSummary);
            should.exist(game.teamB.scoreSummary);
            done();
          });
        });
      });
    });

  })

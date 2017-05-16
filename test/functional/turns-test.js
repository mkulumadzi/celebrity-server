const Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity')
  , Turn = require('../../app/models/turn')
  , seeds = require('../db/seeds')
  , timekeeper = require('timekeeper')
  , moment = require('moment');

describe('game play', function() {

  var gameHeader;
  var gameId;
  var game;

  before( function(done) {
    seeds.createNewGame( function( err, g ){
      game = g;
      gameHeader = "Bearer " + game._id;
      chai.request(server)
        .put('/game/start')
        .send({})
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
  });

  describe('play a turn', function() {

    var playerId;
    var playerHeader;
    var currentTurn;
    var nextCelebrity;

    before( function(done) {
      chai.request(server)
        .get('/game/next')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          playerId = res.body._id;
          playerHeader = "Bearer " + playerId;
          done();
        });
    });

    // Start a turn
    it('starts a turn', function(done) {
      chai.request(server)
        .post('/turns')
        .set('Authorization', playerHeader)
        .send({})
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.celebrity.should.exist;
          res.body.expiresAt.should.exist;
          res.body.turnDuration.should.equal(60);
          res.body.attempts[0].celebrity.should.exist;
          should.not.exist(res.body.attempts[0].correct);
          currentTurn = res.body._id;
          nextCelebrity = res.body.celebrity._id;
          done();
        });
    });

    // Add a correct attempt to a turn
    it('adds a correct attempt', function(done){
      var url = "/turns/" + currentTurn;
      chai.request(server)
        .put(url)
        .set('Authorization', playerHeader)
        .send({celebrity: nextCelebrity, correct: true})
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.celebrity.should.exist;
          res.body.expiresAt.should.exist;
          res.body.attempts[0].celebrity.should.exist;
          res.body.attempts[0].correct.should.exist;
          res.body.attempts[1].celebrity.should.exist;
          should.not.exist(res.body.attempts[1].correct);
          nextCelebrity = res.body.celebrity._id;
          done();
        });
    });

    // Add an incorrect attempt to a turn
    it('adds an incorrect attempt', function(done){
      var url = "/turns/" + currentTurn;
      chai.request(server)
        .put(url)
        .set('Authorization', playerHeader)
        .send({celebrity: nextCelebrity, correct: false})
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.celebrity.should.exist;
          res.body.expiresAt.should.exist;
          res.body.attempts[1].correct.should.be.false;
          nextCelebrity = res.body.celebrity._id;
          done();
        });
    });

    // Show that you can't add an attempt after the turn has expired
    //// Will need to use the 'timekeeper' package to travel and show that the turn was expired
    it('returns an error if the turn has expired.', function(done){
      var url = "/turns/" + currentTurn;
      var time = moment().add(2, 'minutes').toDate();
      timekeeper.travel(time);
      chai.request(server)
        .put(url)
        .set('Authorization', playerHeader)
        .send({celebrity: nextCelebrity, correct: false})
        .end(function(err, res) {
          should.exist(err);
          res.should.have.status(401);
          timekeeper.reset();
          done();
        });
    });


    // Show that the game reflects the updated score
    it('shows the score on the game', function(done){
      chai.request(server)
        .get('/game')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.teamA.score.should.equal(1);
          res.body.teamB.score.should.equal(0);
          done();
        });
    });

    // Play 8 more celebrities that are right and show the new scores.
    it('continues to calculate the score correctly as the game progresses', function(done) {
      chai.request(server)
        .get('/game')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          should.exist(res.body.nextPlayer);
          var teamAScore = res.body.teamA.score;
          var teamBScore = res.body.teamB.score;
          var startScore = teamAScore + teamBScore;
          Game.findOne({_id: game._id}, function(err, game) {
            should.not.exist(err);
            seeds.playNTurns( game, 4, 2, 1, function( err, game) {
              should.not.exist(err);
              chai.request(server)
                .get('/game')
                .set('Authorization', gameHeader)
                .end(function(err, res) {
                  should.not.exist(err);
                  res.should.have.status(200);
                  var teamAScore = res.body.teamA.score;
                  var teamBScore = res.body.teamB.score;
                  var totalScore = teamAScore + teamBScore;
                  totalScore.should.equal(8 + startScore);
                  done();
                });
            });
          })
        });
    });

    // Show that when all the celebrities in the round are done, instead of getting the next celebrity, you get a status indicating that the round is over
    it('returns no celebrity for the turn after the last celebrity has been marked correct in that round.', function(done) {
      chai.request(server)
        .get('/game')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          var teamAScore = res.body.teamA.score;
          var teamBScore = res.body.teamB.score;
          var startScore = teamAScore + teamBScore;
          var celebrityCount = res.body.celebrities.length;
          var nextRoundRight = celebrityCount - startScore - 1;
          Game.findOne({_id: game._id}, function(err, game) {
            should.not.exist(err);
            seeds.playNTurns( game, 1, nextRoundRight, 0, function( err, game) {
              should.not.exist(err);
              chai.request(server)
                .get('/game/next')
                .set('Authorization', gameHeader)
                .end(function(err, res) {
                  should.not.exist(err);
                  res.should.have.status(200);
                  playerId = res.body._id;
                  playerHeader = "Bearer " + playerId;
                  chai.request(server)
                    .post('/turns')
                    .set('Authorization', playerHeader)
                    .send({})
                    .end(function(err, res) {
                      should.not.exist(err);
                      res.should.have.status(201);
                      currentTurn = res.body._id;
                      nextCelebrity = res.body.celebrity._id;
                      var url = "/turns/" + currentTurn;
                      chai.request(server)
                        .put(url)
                        .set('Authorization', playerHeader)
                        .send({celebrity: nextCelebrity, correct: true})
                        .end(function(err, res) {
                          should.not.exist(err);
                          res.should.have.status(200);
                          should.not.exist(res.body.celebrity);
                          done();
                        });
                    });
                });
            });
          });
        });
    });

    // Show that when all the celebrities in the round are done, instead of getting the next celebrity, you get a status indicating that the round is over
    it('starts the next round', function(done) {
      chai.request(server)
        .get('/game/next')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          playerId = res.body._id;
          playerHeader = "Bearer " + playerId;
          chai.request(server)
            .post('/turns')
            .set('Authorization', playerHeader)
            .send({})
            .end(function(err, res) {
              should.not.exist(err);
              res.should.have.status(201);
              res.body.round.should.equal('roundTwo');
              done();
            });
        });
    });

    // Show that you can't start a turn if you are not the next player

    // Show that you can't start a turn if there is an active turn running


  });

});

const Game = require('../../app/models/game')
  , seeds = require('../db/seeds')
  , timekeeper = require('timekeeper')
  , moment = require('moment');

describe('players CRUD', function() {

  var shortId;
  var gameId;
  var playerId;

  before( function(done) {
    chai.request(server)
      .post('/games')
      .end(function(err, res){
        shortId = res.body.shortId.toString();
        gameId = res.body._id;
        done();
    });
  });

  describe('POST /join', function() {
    it('should add a player to a game', function(done) {
      chai.request(server)
        .post('/join')
        .send({"shortId": shortId, "name": "Player 1"})
        .end(function(err, res){
          should.not.exist(err);
          res.should.have.status(201);
          res.should.be.json;
          res.body.name.should.be.string;
          res.body.game.should.be.string;
          playerId = res.body._id;
          done();
        });
    });

    it('should require a name for the player', function(done) {
      chai.request(server)
        .post('/join')
        .send({"shortId": shortId})
        .end(function(err, res){
          should.exist(err);
          res.should.have.status(400);
          res.body.message.should.be.string;
          done();
        });
    });

    it('should require a valid shortId', function(done) {
      chai.request(server)
        .post('/join')
        .send({"shortId": "food", "name": "Player 1"})
        .end(function(err, res){
          should.exist(err);
          res.should.have.status(400);
          res.body.message.should.be.string;
          done();
        });
    });

    it('should require player names to be unique in a game', function(done) {
      chai.request(server)
        .post('/join')
        .send({"shortId": shortId, "name": "Player 1"})
        .end(function(err, res){
          should.exist(err);
          res.should.have.status(400);
          res.body.message.should.be.string;
          done();
        });
    });

    it('should limit the game to eight players', function(done){
      chai.request(server)
        .post('/games')
        .end(function(err, res){
          game = res.body;
          players = ["1", "2", "3", "4", "5", "6", "7", "8"]
          async.each(players, function(player, cb) {
            chai.request(server)
            .post('/join')
            .send({"shortId": game.shortId, "name": player })
            .end(function(err, res){
              should.not.exist(err);
              cb();
            });
          }, function() {
            chai.request(server)
            .post('/join')
            .send({"shortId": game.shortId, "name": "too many" })
            .end(function(err, res){
              res.should.have.status(400);
              res.body.message.should.be.string;
              should.exist(err);
              done();
            });
          });
        });
    });

    // it('should only allow new games to be joined', function(done){
    //   Game.findOne({'_id': gameId}, function(err, game) {
    //     should.not.exist(err);
    //     game.update({"status": "started"})
    //     done()
    //   });
    // });
  });

  describe('GET /player', function() {

    var playerHeader;

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

    it('should return the player with status 1 if it is their turn', function(done) {
      chai.request(server)
        .get('/game/next')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          playerHeader = "Bearer " + res.body._id;
          chai.request(server)
            .get('/player')
            .set('Authorization', playerHeader)
            .end(function(err, res){
              should.not.exist(err);
              res.should.have.status(200);
              res.body.status.should.equal(1);
              done();
            });
        });
      });

      it('should return the player with status 2 and the turn if the turn is in progress', function(done) {
        chai.request(server)
          .post('/turns')
          .set('Authorization', playerHeader)
          .send({})
          .end(function(err, res) {
            should.not.exist(err);
            chai.request(server)
              .get('/player')
              .set('Authorization', playerHeader)
              .end(function(err, res){
                should.not.exist(err);
                res.should.have.status(200);
                res.body.status.should.equal(2);
                should.exist(res.body.turn.attempts[0].celebrity.name);
                done();
              });
          });
        });

        it('should return the player with status 0 after the turn has ended', function(done) {
          var time = moment().add(1, 'minutes').toDate();
          timekeeper.travel(time);
          chai.request(server)
            .get('/player')
            .set('Authorization', playerHeader)
            .end(function(err, res){
              should.not.exist(err);
              res.should.have.status(200);
              res.body.status.should.equal(0);
              timekeeper.reset();
              done();
            });
        });

  });

});

const Game = require('../../app/models/game')
  , seeds = require('../db/seeds');

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
            chai.request(server)
              .get('/game')
              .set('Authorization', gameHeader)
              .end(function(err, res) {
                should.not.exist(err);
                done();
              });
            });
          });
        });

    // before( function(done) {
    //   playerHeader = "Bearer " + playerId;
    //   done();
    // });
    //
    it('should return the player', function(done) {
      done();
      // chai.request(server)
      //   .get('/player')
      //   .set('Authorization', playerHeader)
      //   .end(function(err, res){
      //     should.not.exist(err);
      //     res.should.have.status(200);
      //     res.body._id.should.equal(playerId);
      //     done();
      //   });
    });
    //
    // it('should indicate that it is not their turn, if they are not next', function(done) {
    //   chai.request(server)
    //     .get('/player')
    //     .set('Authorization', playerHeader)
    //     .end(function(err, res){
    //       should.not.exist(err);
    //       res.should.have.status(200);
    //       res.body.turnStatus.should.equal(0);
    //       done();
    //     });
    // });

  });


});

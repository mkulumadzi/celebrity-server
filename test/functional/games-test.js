const Game = require('../../app/models/game');
const Player = require('../../app/models/player');
const Celebrity = require('../../app/models/celebrity')
const seeds = require('../db/seeds');

describe('create game', function() {

  var gameId = '';

  it('should create a game, generating a shortId and giving it a status of new', function(done) {
    chai.request(server)
      .post('/games')
      .end(function(err, res){
        should.not.exist(err);
        res.should.have.status(201);
        res.should.be.json;
        res.body.shortId.should.be.string;
        res.body.shortId.should.have.lengthOf(4);
        res.body.status.should.equal('new');
        gameId = res.body._id.toString();
        done();
    });
  });

  it('should get all games', function(done) {
    chai.request(server)
      .get('/games')
      .end(function(err, res){
        should.not.exist(err);
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        done();
    });
  });

  it('should get a single game', function(done) {
    var requestUrl = "/games/" + gameId;
    chai.request(server)
      .get(requestUrl)
      .end(function(err, res){
        should.not.exist(err);
        res.should.have.status(200);
        res.should.be.json;
        done();
      })
  })

});

describe('start game', function() {

  describe( 'started successfully', function() {
    var gameHeader;

    before( function(done) {
      seeds.createNewGame( function( err, game ){
        gameHeader = "Bearer " + game._id;
        done();
      });
    });

    it('starts the game', function(done){
      chai.request(server)
        .put('/game/start')
        .send({})
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(201);
          res.body.status.should.equal("started");
          done();
        });
    });

    it('gets the game', function(done){
      chai.request(server)
        .get('/game')
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          res.body.players.should.have.length(4);
          res.body.celebrities.should.have.length(20);
          res.body.celebrities[0].name.should.exist;
          should.not.exist(res.body.celebrities[0].created_at);
          done();
        });
    });
  });

  describe('error conditions', function() {

    var gameHeader;
    var game;

    before( function(done) {
      seeds.createNewGame( function( err, g ){
        game = g;
        gameHeader = "Bearer " + game._id;
        done();
      });
    });

    it('returns an error if the game status is not new', function(done){
      chai.request(server)
        .put('/game/start')
        .send({})
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          chai.request(server)
            .put('/game/start')
            .send({})
            .set('Authorization', gameHeader)
            .end(function(err, res) {
              should.exist(err);
              res.should.have.status(400);
              done();
            });
        });
    });

    it('returns an error if the game has less than twenty celebrities', function(done){
      Celebrity.findOneAndRemove({addedBy: game.players[0]}, function(err, result){
        should.not.exist( err );
        chai.request(server)
          .put('/game/start')
          .send({})
          .set('Authorization', gameHeader)
          .end(function(err, res) {
            should.exist(err);
            res.should.have.status(400);
            done();
          });
      });
    });

    it('returns an error if the game has less than four players', function(done){
      Player.findOneAndRemove({game: game._id}, function(err, result){
        should.not.exist( err );
        chai.request(server)
          .put('/game/start')
          .send({})
          .set('Authorization', gameHeader)
          .end(function(err, res) {
            should.exist(err);
            res.should.have.status(400);
            done();
          });
      });
    });
  });

});

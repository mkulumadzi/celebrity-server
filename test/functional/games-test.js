const Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity')
  , Turn = require('../../app/models/turn')
  , seeds = require('../db/seeds')
  , moment = require('moment')
  , timekeeper = require('timekeeper');

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
        res.body.phase.should.equal('new');
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
          res.body.phase.should.equal("started");
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

describe('next player', function() {

  var gameHeader;
  var game;
  var nextPlayer;

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


  it('should return the first player from team A at the start of the game', function(done) {
    chai.request(server)
      .get('/game/next')
      .set('Authorization', gameHeader)
      .end(function(err, res) {
        should.not.exist(err);
        res.should.have.status(200);
        nextPlayer = res.body;
        res.body.name.should.exist;
        res.body.team.should.exist;
        res.body.team.name.should.exist;
        res.body.team.name.should.equal("Team A");
        done();
      });
  });

  it('should return the first player from team B after one turn has been played', function(done) {
    Game.findOne({_id: gameId}, function( err, g ) {
      should.not.exist(err);
      game = g;
      var turn = new Turn({team: game.teamA, player: nextPlayer, game: game._id, round: "roundOne", expiresAt: moment() });
      turn.save( function( err, res ) {
        should.not.exist(err);
        game.roundOne.push(turn);
        game.save( function( err, res ) {
          should.not.exist(err);
          chai.request(server)
            .get('/game/next')
            .set('Authorization', gameHeader)
            .end(function(err, res) {
              should.not.exist(err);
              nextPlayer = res.body;
              res.body.team.name.should.equal("Team B");
              done();
            });
        });
      });
    });
  });

  it('should return that player and their turn if the turn has started', function(done) {
    var time = moment().add(1, 'minutes').toDate();
    timekeeper.travel(time);
    var turn = new Turn({team: nextPlayer.team, player: nextPlayer._id, game: game._id, round: "roundOne", expiresAt: moment().add(1, 'm') });
    turn.save( function( err, res ) {
      should.not.exist(err);
      game.roundOne.push(turn);
      game.save( function( err, res ) {
        should.not.exist(err);
        chai.request(server)
          .get('/game/next')
          .set('Authorization', gameHeader)
          .end(function(err, res) {
            should.not.exist(err);
            res.body._id.should.equal(nextPlayer._id);
            should.exist(res.body.turn);
            done();
          });
        });
      });
  });


  // Error conditions:
  // - Game is not in started state: should throw an error

});

describe('get game', function() {

  var gameHeader;
  var game;
  var nextPlayer;

  before( function(done) {
    seeds.createNewGame( function( err, g ){
      game = g;
      gameHeader = "Bearer " + game._id;
      done();
    });
  });

  it('gets the game before it is started', function(done) {
    chai.request(server)
      .get('/game')
      .set('Authorization', gameHeader)
      .end(function(err, res) {
        should.not.exist(err);
        game = res.body;
        should.exist(game.celebrities[0]);
        should.exist(game.celebrities[0].name);
        should.exist(game.players[0]);
        should.exist(game.players[0].name);
        done();
      });
  });

  it('gets the game at the end of the game', function(done) {
    Game.findOne({_id: game._id}, function( err, game ) {
      game.start( function(err, game) {
        should.not.exist(err);
        seeds.playNTurns( game, 3, 20, 0, function( err, game) {
          should.not.exist(err);
          game.phase = "ended";
          game.save(function(err, r) {
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
    });
  });

});

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

    seeds.createNewGame( function( err ){

    });

    before( function(done) {
      Game.create({shortId: "ABCD", status: "new" }, function( err, game) {
        if ( err ) { console.log( err ); }
        gameHeader = "Bearer " + game._id;
        players = ["player1", "player2", "player3", "player4"];
        async.each( players, function( player, cb) {
          Player.create({ name: player, game: game._id }, function( err, player ) {
            if ( err ) { console.log( err ); }
            celebrities = ["a", "b", "c", "d", "e"];
            async.each( celebrities, function( celebrity, cb) {
              Celebrity.create({ name: celebrity, game: game._id, addedBy: player._id}, function( err, celebrity){
                if ( err ) { console.log( err ); }
                cb();
              });
            }, function() {
              cb();
            });
          });
        }, function() {
          done();
        });
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
          done();
        });
    });
  });

  describe('error conditions', function() {

    var gameHeader;

    it('returns an error if the game status is not new', function(done){
      chai.request(server)
        .post('/games')
        .end(function(err, res){
          var game = res.body;
          gameHeader = "Bearer " + game._id;
          Game.findOne({'_id': game._id }, function( err, game) {
            should.not.exist(err);
            game.update({'status': 'started'}, function( err, updated) {
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
        });
      });

    it('returns an error if the game has less than twenty celebrities', function(done){
      chai.request(server)
        .post('/games')
        .end(function(err, res){
          var game = res.body;
          gameHeader = "Bearer " + game._id;
          players = ["player1", "player2", "player3", "player4"]
          async.each(players, function( player, cb) {
            chai.request(server)
              .post('/join')
              .send({"shortId": game.shortId, "name": player })
              .end(function(err, res){
                var player = res.body;
                authHeader = "Bearer " + player._id;
                celebrities = ["a", "b", "c", "d"]
                async.each(celebrities, function(celebrity, cb) {
                  chai.request(server)
                  .post('/celebrity')
                  .set('Authorization', authHeader)
                  .send({"name": celebrity})
                  .end(function(err, res){
                    cb();
                  });
                }, function() {
                  cb();
                });
              });
          }, function() {
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

    it('returns an error if the game has less than four players', function(done){
      chai.request(server)
        .post('/games')
        .end(function(err, res){
          var game = res.body;
          gameHeader = "Bearer " + game._id;
          players = ["player1", "player2", "player3"]
          async.each(players, function( player, cb) {
            chai.request(server)
              .post('/join')
              .send({"shortId": game.shortId, "name": player })
              .end(function(err, res){
                var player = res.body;
                authHeader = "Bearer " + player._id;
                celebrities = ["a", "b", "c", "d", "e"]
                async.each(celebrities, function(celebrity, cb) {
                  chai.request(server)
                  .post('/celebrity')
                  .set('Authorization', authHeader)
                  .send({"name": celebrity})
                  .end(function(err, res){
                    cb();
                  });
                }, function() {
                  cb();
                });
              });
          }, function() {
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

});

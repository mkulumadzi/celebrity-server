const Game = require('../../app/models/game');

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

  // Create a game
  // add four players
  // add five celebs per player
  // show the game can be started
  // show the game cannot be started if it has less than 4 players
  // show the game cannot be started if it has less than 20 celebrities
  // show the game cannot be startd if its status is not 'new'
  describe( 'started successfully', function() {
    var gameHeader;

    before( function(done) {
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
            done();
          });
        });
      });

    it('starts the game', function(done){
      chai.request(server)
        .post('/game/start')
        .send({})
        .set('Authorization', gameHeader)
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(204);
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
                .post('/game/start')
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
              .post('/game/start')
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
              .post('/game/start')
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

describe( 'get game', function() {
  
});

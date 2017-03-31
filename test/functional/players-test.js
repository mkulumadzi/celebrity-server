describe('players CRUD', function() {

  var shortId = '';

  before( function(done) {
    chai.request(server)
      .post('/games')
      .end(function(err, res){
        shortId = res.body.shortId.toString();
        done();
    });
  });

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

});

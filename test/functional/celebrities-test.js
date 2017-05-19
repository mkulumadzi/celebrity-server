describe('celebrities CRUD', function() {

  var player;
  var game;
  var authHeader;

  before( function(done) {
    chai.request(server)
      .post('/games')
      .end(function(err, res){
        game = res.body;
        chai.request(server)
          .post('/join')
          .send({"shortId": game.shortId, "name": "Player 1"})
          .end(function(err, res){
            player = res.body;
            authHeader = "Bearer " + player._id;
            done();
          });
    });
  });

  it('should add a celebrity to the game', function(done) {
    chai.request(server)
    .post('/celebrity')
    .set('Authorization', authHeader)
    .send({"name": "Bob Hope"})
    .end(function(err, res){
      should.not.exist(err);
      res.should.have.status(201);
      res.body.name.should.equal("Bob Hope");
      done();
    })
  });

  it('should require a name', function(done){
    chai.request(server)
    .post('/celebrity')
    .set('Authorization', authHeader)
    .send({"foo": "bar"})
    .end(function(err, res){
      should.exist(err);
      res.should.have.status(400);
      res.body.message.should.be.string;
      done();
    })
  });

  it('should require an Authorization header', function(done){
    chai.request(server)
    .post('/celebrity')
    .send({"name": "Bob Hope"})
    .end(function(err, res){
      should.exist(err);
      res.should.have.status(401);
      res.body.message.should.be.string;
      done();
    })
  });

  it('should require a valid Authorization header', function(done){
    chai.request(server)
    .post('/celebrity')
    .set('Authorization', "invalid")
    .send({"name": "Bob Hope"})
    .end(function(err, res){
      should.exist(err);
      res.should.have.status(401);
      res.body.message.should.be.string;
      done();
    })
  });

  it('should allow a player to add a maximum of ten celebrities', function(done){
    chai.request(server)
      .post('/join')
      .send({"shortId": game.shortId, "name": "Player 2"})
      .end(function(err, res){
        player = res.body;
        authHeader = "Bearer " + player._id;
        celebrities = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
        async.each(celebrities, function(celebrity, cb) {
          chai.request(server)
          .post('/celebrity')
          .set('Authorization', authHeader)
          .send({"name": celebrity})
          .end(function(err, res){
            cb();
          });
        }, function() {
          chai.request(server)
          .post('/celebrity')
          .set('Authorization', authHeader)
          .send({"name": "too many"})
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

describe 'games CRUD with Coffee', ->

  console.log("I'm testing with coffee")

  gameId = ''

  it 'should create a game, generating a shortId and giving it a status of new', (done) ->
    console.log("I'm testing with coffee")
    done()
    # chai.request(server)
    #   .post('/games')
    #   .end((err, res) ->
    #     should.not.exist(err)
    #     res.should.have.status(201)
    #     res.should.be.json
    #     res.body.shortId.should.be.string
    #     res.body.shortId.should.have.lengthOf(4)
    #     res.body.status.should.equal('new')
    #     gameId = res.body._id.toString()
    #     done()

#   it('should get all games', function(done) {
#     chai.request(server)
#       .get('/games')
#       .end(function(err, res){
#         should.not.exist(err);
#         res.should.have.status(200);
#         res.should.be.json;
#         res.body.should.be.a('array');
#         done();
#     });
#   });
#
#   it('should get a single game', function(done) {
#     var requestUrl = "/games/" + gameId;
#     chai.request(server)
#       .get(requestUrl)
#       .end(function(err, res){
#         should.not.exist(err);
#         res.should.have.status(200);
#         res.should.be.json;
#         done();
#       })
#   })
# });

global.restify = require('restify')
global.mongoose = require('mongoose')
global.chai = require('chai')
global.chaiHttp = require('chai-http')
global.should = chai.should();
global.server = require('../app/server');

chai.use(chaiHttp);
mongoose.Promise = global.Promise;

describe('echo', function() {

  it('should echo parameters', function(done) {
    chai.request(server)
      .get('/echo?marco=polo')
      .end(function(err, res){
        res.should.have.status(200);
        res.should.be.json;
        res.body.marco.should.equal('polo');
        done();
      });
  });
});

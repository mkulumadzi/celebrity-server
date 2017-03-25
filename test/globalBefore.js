const mongoose = require('mongoose');

// Drop the database before starting the tests;
before(function(done) {
  this.timeout(10000); // Wait for db connection to be created
  mongoose.connection.on('open', function(){
    mongoose.connection.db.dropDatabase();
    done();
  })
});

const restify = require('restify');

// Server

server = require('./app/server.js');

server.listen(process.env.port || 8080, function() {
  console.log("Server listening at %s", server.url)
});

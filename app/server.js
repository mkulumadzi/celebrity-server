const C = require('config')
  , restify = require('restify')
  , restifyMongoose = require('restify-mongoose')
  , mongoose = require('mongoose')
  , controllers = require('./controllers')
  , socketio = require('socket.io');

// Database configuration
if( !mongoose.connection.readyState ){

    mongoose.connect( C.Mongo.host, C.Mongo.database, C.Mongo.port, function( err ){
        if( err ){
            console.log('Could not connect to MongoDB', err );
            process.exit(1);
        }
        console.log( 'MongoDB Connected!' );
    });
}

// Initialize server
var server = restify.createServer({
  name: 'restify.mongoose.celebrity',
  version: '1.0.0'
});



server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// CORS configuration
function unknownMethodHandler(req, res) {
  console.log("You cannot do that");
  if (req.method.toLowerCase() === 'options') {
      console.log('received an options method request');
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With']; // added Origin & X-Requested-With

    if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', res.methods.join(', '));
    res.header('Access-Control-Allow-Origin', "*");

    return res.send(204);
  }
  else
    return res.send(new restify.MethodNotAllowedError());
}

server.on('MethodNotAllowed', unknownMethodHandler);
server.use(restify.CORS());

// Basic routes
server.get( '/echo', function( req, res, next){
  res.send( 200, req.query );
  next();
})

// Load controllers
new controllers.game(server);
new controllers.player(server);
new controllers.celebrity(server);
new controllers.turn(server);

// Initialize socket.io
var io = socketio.listen(server.server);
io.sockets.on('connection', function (socket) {

  // Join the room (games will create a room with a game._id)
  socket.on('room', function(room) {
    socket.join(room);
    io.to(room).emit('message', "Welcome to the game: " + room);
  });
});

module.exports = server;

exports.io = io;

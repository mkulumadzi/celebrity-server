const faker = require('faker')
  , Game = require('../../app/models/game')
  , Player = require('../../app/models/player')
  , Celebrity = require('../../app/models/celebrity');

var Seeds = function() { }

module.exports = Seeds;

Seeds.prototype.createNewGame = function( cb ) {
  createGame( function( err, game) {
    if ( err ) { cb( err ); }
    addPlayersAndCelebrities( game, function( err ) {
      if ( err ) { cb( err ); }
      game.save(); // Game is not saved while adding celebrities because async calls save celebrities more than once.
      cb( null, game);
    });
  });
}

var createGame = function( cb ) {
  Game.create({shortId: "ABCD", status: "new" }, function( err, game) {
    if ( err ) { cb( err ); }
    cb( null, game );
  });
}

var addPlayersAndCelebrities = function( game, cb ) {
  players = [0, 1, 2, 3];
  async.each( players, function( player, cb) {
    game.addPlayer( faker.name.findName(), function( err, player) {
      if ( err ) { cb( err ); }
      addCelebrities( game, player, function( err ){
        if ( err ) { cb( err ); }
        cb();
      });
    });
  }, function(){
    cb();
  });
}

var addCelebrities = function( game, player, cb ) {
  celebrities = [0, 1, 2, 3, 4];
  async.each( celebrities, function( celebrity, cb) {
    game.addCelebrity( player, faker.name.findName(), function( err, celebrity) {
      if ( err ) { console.log( err ); }
      cb();
    });
  }, function() {
    cb();
  });
}

module.exports.createNewGame = Seeds.prototype.createNewGame;

const Game = require('../../app/models/game');
const Player = require('../../app/models/player');
const Celebrity = require('../../app/models/celebrity');

var Seeds = function() { }

module.exports = Seeds;

Seeds.prototype.createNewGame = function( cb ) {
  createGame( function( err, game) {
    if ( err ) { cb( err ); }
    addPlayersAndCelebrities( game, function( err ) {
      if ( err ) { cb( err ); }
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
  players = ["player1", "player2", "player3", "player4"];
  async.each( players, function( player, cb) {
    Player.create({ name: player, game: game._id }, function( err, player ) {
      if ( err ) { cb( err ); }
      addCelebrities( player, function( err ){
        if ( err ) { cb( err ); }
        cb();
      });
    });
  }, function(){
    cb();
  });
}

var addCelebrities = function( player, cb ) {
  celebrities = ["a", "b", "c", "d", "e"];
  async.each( celebrities, function( celebrity, cb) {
    Celebrity.create({ name: celebrity, game: player.game, addedBy: player._id }, function( err, celebritiy ) {
      if ( err ) { console.log( err ); }
      cb();
    });
  }, function() {
    cb();
  });
}

module.exports.createNewGame = Seeds.prototype.createNewGame;

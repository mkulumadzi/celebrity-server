const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Player = require('./player')
  , Celebrity = require('./celebrity')

var GameSchema = new mongoose.Schema({
  shortId: { type: String, required: true }
  , status: { type: String, required: true }
}, {
  toObject: {
    virtuals: true
  },
  toJson: {
    virtuals: true
  }
});

GameSchema.methods.players = function( cb ) {
  var game = this;
  Player.find({game: this._id }, function( err, players ){
    if ( err ) { cb( err ); }
    cb( null, players );
  });
}

GameSchema.methods.playerObjects = function( cb ) {
  var game = this;
  playerObjects = [];
  game.players( function( err, players) {
    if ( err ) { cb( err ); }
    async.each( players, function( player, cb) {
      playerObjects.push( { _id: player._id, name: player.name });
      cb();
    }, function() {
      cb( null, playerObjects );
    });
  });
}

GameSchema.methods.celebrities = function( cb ) {
  var game = this;
  Celebrity.find({game: this._id }, function( err, celebrities ){
    if ( err ) { cb( err ); }
    cb( null, celebrities );
  });
}

GameSchema.methods.celebrityObjects = function( cb ) {
  var game = this;
  celebrityObjects = [];
  game.celebrities( function( err, celebrities ) {
    if ( err ) { cb( err ); }
    async.each( celebrities, function( celebrity, cb) {
      celebrityObjects.push( { _id: celebrity._id, name: celebrity.name });
      cb();
    }, function() {
      cb( null, celebrityObjects );
    });
  });
}

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

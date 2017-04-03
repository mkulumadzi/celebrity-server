const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Player = require('./player')

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

var players = function( cb ) {
  var game = this;
  Player.find({game: this._id }, function( err, players ){
    if ( err ) { cb( err ); }
    cb( null, players );
  });
}

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

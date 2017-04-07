const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Player = require('./player')
  , Celebrity = require('./celebrity')
  , Team = require('./team')

var GameSchema = new mongoose.Schema({
  shortId: { type: String, required: true }
  , status: { type: String, required: true }
  , players: [ { type: ObjectId, ref: 'Player'} ]
  , celebrities: [ { type: ObjectId, ref: 'Celebrity'} ]
  , teamA: { type: ObjectId, ref: 'Team'}
  , teamB: { type: ObjectId, ref: 'Team'}
});

GameSchema.methods.addPlayer = function( name, cb ) {
  var game = this;
  var player = new Player( { name: name, game: this._id });
  player.save( function(err, result) {
    if (err) {
      return cb(err);
    } else {
      // Game is not saved during this method, because if multiple celebrirites are bing added at the same time they can be duplicated.
      game.players.push( player._id );
      cb( null, player );
    }
  });
}

GameSchema.methods.addCelebrity = function( player, name, cb ) {
  var game = this;
  var celebrity = new Celebrity( { name: name, addedBy: player._id });
  celebrity.save( function(err, result) {
    if (err) {
      return cb(err);
    } else {
      // Game is not saved during this method, because if multiple celebrirites are bing added at the same time they can be duplicated.
      game.celebrities.push( celebrity._id );
      cb( null, celebrity );
    }
  });
}

GameSchema.methods.createTeam = function( name, playerIds, cb ) {
  var game = this;
  var team = new Team( { name: name, game: this._id, players: playerIds });
  team.save( function(err, result) {
    if ( err ) {
      return cb( err );
    } else {
      cb( null, team );
    }
  });
}

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

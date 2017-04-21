const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Turn = require('./turn');

var TeamSchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, ref: 'Game', required: true }
  , players: [ { type: ObjectId, ref: 'Player', required: true }]
})

TeamSchema.methods.currentScore = function( cb ) {
  var team = this;
  Turn.find({team: this._id}, function( err, turns) {
    if (err) {
      cb( err );
    } else {
      currentScore = 0;
      async.each( turns, function( turn, cb) {
        turn.score( function( turnScore ) {
          currentScore += turnScore;
          cb();
        });
      }, function() {
        cb( null, currentScore );
      });
    }
  });
}

TeamSchema.plugin(timestamps);

var Team = mongoose.model('Team', TeamSchema);
module.exports = Team;

const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , async = require('async')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Turn = require('./turn');

var TeamSchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, ref: 'Game', required: true }
  , players: [ { type: ObjectId, ref: 'Player', required: true }]
})

TeamSchema.methods.scoreSummary = function( cb ) {
  var team = this;
  var scoreSummary = { roundOne: 0, roundTwo: 0, roundThree: 0 };
  var totalScore = 0;
  team.roundScore( "roundOne", function( err, score) {
    if ( err ) {
      cb( err );
    } else {
      scoreSummary.roundOne = score;
      totalScore += score;
      if ( score == 0 ) {
        cb( null, scoreSummary, totalScore );
      } else {
        team.roundScore( "roundTwo", function( err, score) {
          if ( err ) {
            cb( err );
          } else {
            scoreSummary.roundTwo = score;
            totalScore += score;
            if ( score == 0 ) {
              cb( null, scoreSummary, totalScore );
            } else {
              team.roundScore( "roundThree", function( err, score) {
                if ( err ) {
                  cb( err );
                } else {
                  scoreSummary.roundThree = score;
                  totalScore += score;
                  cb( null, scoreSummary, totalScore );
                }
              });
            }
          }
        });
      }
    }
  });
}

// TeamSchema.methods.currentScore = function( cb ) {
//   var team = this;
//   Turn.find({team: this._id}, function( err, turns) {
//     if (err) {
//       cb( err );
//     } else {
//       currentScore = 0;
//       async.eachSeries( turns, function( turn, cb) {
//         turn.score( function( turnScore ) {
//           currentScore += turnScore;
//           cb();
//         });
//       }, function() {
//         cb( null, currentScore );
//       });
//     }
//   });
// }

TeamSchema.methods.roundScore = function( round, cb ) {
  var team = this;
  Turn.find({team: this._id, round: round }, function( err, turns) {
    if (err) {
      cb( err );
    } else {
      score = 0;
      async.eachSeries( turns, function( turn, cb) {
        turn.score( function( turnScore ) {
          score += turnScore;
          cb();
        });
      }, function() {
        cb( null, score );
      });
    }
  });
}

TeamSchema.plugin(timestamps);

var Team = mongoose.model('Team', TeamSchema);
module.exports = Team;

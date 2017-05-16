const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , async = require('async')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , moment = require('moment')
  , Celebrity = require('./celebrity');

var AttemptSchema = new Schema({
  celebrity: { type: ObjectId, ref: 'Celebrity', required: true }
  , correct: { type: Boolean }
})

var TurnSchema = new mongoose.Schema({
  team: { type: ObjectId, ref: 'Team', required: true }
  , game: { type: ObjectId, ref: 'Game', required: true }
  , round: { type: String, required: true }
  , player: { type: ObjectId, ref: 'Player', required: true }
  , expiresAt: { type: Date, required: true }
  , attempts: [AttemptSchema]
})

TurnSchema.statics.startTurn = function( player, game, cb ) {
  game.currentRound( function( err, currentRound) {
    if ( err ) {
      cb( err );
    } else {
      var turn = new Turn({ team: player.team, player: player._id, game: game._id, round: currentRound, expiresAt: moment().add(1, 'm') });
      turn.save( function( err, turn) {
        if ( err ) {
          cb( err );
        } else {
          if ( currentRound === "roundOne" ) {
            game.roundOne.push(turn);
          } else if ( currentRound === "roundTwo" ) {
            game.roundTwo.push(turn);
          } else if ( currentRound === "roundThree" ) {
            game.roundThree.push(turn);
          } else {
            cb( new Error('Unknown round: ' + currentRound) );
          }
          game.save( function ( err, game) {
            if ( err ) {
              cb( err );
            } else {
              getNextCelebrity( game, turn, function( err, turn, celebrity) {
                if ( err ) {
                  cb( err );
                } else {
                  cb( null, turn, celebrity );
                }
              });
            }
          });
        }
      });
    }
  })
}

TurnSchema.methods.addAttempt = function( game, attempt, cb ) {
  var turn = this;
  var ex = this.attempts.filter(function(a) {
    return a.celebrity == attempt.celebrity;
  }).pop();

  if ( ex ) { // Update existing attempt
    ex.correct = attempt.correct;
    ex.save(function( err ) {
      if ( err ) {
        cb( err );
      } else {
        completeAddingAttempt( turn, game, attempt, function( err, turn, celebrity) {
          if ( err ) {
            cb( err );
          } else {
            cb( null, turn, celebrity );
          }
        });
      }
    });
  } else { // Fallback, mainly for testing, if the attempt is not already there.
    var attempt = new Attempt(attempt);
    turn.attempts.push(attempt);
    turn.save( function( err, turn ) {
      completeAddingAttempt( turn, game, attempt, function( err, turn, celebrity) {
        if ( err ) {
          cb( err );
        } else {
          cb( null, turn, celebrity );
        }
      });
    });
  }
}

TurnSchema.methods.timeRemaining = function() {
  var turn = this;
  return Math.ceil(
    moment.duration(moment(turn.expiresAt)
    .diff(turn.created_at)).asSeconds()
  );
}

var completeAddingAttempt = function( turn, game, attempt, cb ) {
  markCelebrityDoneIfCorrect( game, attempt, function( err ) {
    if (err) {
      cb( err );
    } else {
      getNextCelebrity( game, turn, function( err, turn, celebrity) {
        if ( err ) {
          cb( err );
        } else {
          cb( null, turn, celebrity );
        }
      });
    }
  });
}

var getNextCelebrity = function( game, turn, cb ) {
  game.nextCelebrity( turn, function( err, celebrity) {
    if ( err ) {
      cb( err );
    } else if (celebrity) {
      turn.attempts.push(new Attempt({celebrity: celebrity._id}));
      turn.save( function( err, result) {
        if ( err ) {
          cb( err );
        } else {
          cb( null, turn, celebrity );
        }
      })
    } else {
      cb( null, turn, null );
    }
  });
}

var markCelebrityDoneIfCorrect = function(game, attempt, cb ) {
  if( attempt.correct ) {
    Celebrity.findOne({_id: attempt.celebrity}, function( err, celebrity) {
      game.currentRound( function(err, currentRound) {
        if ( err ) {
          cb( err );
        } else {
          if ( currentRound === "roundOne" ) {
            celebrity.update({doneRoundOne: true }, function( err, result ) {
              if (err ) {
                cb( err );
              } else {
                cb();
              }
            });
          } else if ( currentRound === "roundTwo" ) {
            celebrity.update({doneRoundTwo: true }, function( err, result ) {
              if (err ) {
                cb( err );
              } else {
                cb();
              }
            });
          } else if ( currentRound === "roundThree" ) {
            celebrity.update({doneRoundTwo: true }, function( err, result ) {
              if (err ) {
                cb( err );
              } else {
                cb();
              }
            });
          } else {
            cb( new Error("Error marking celebrity as done: " + celebrity ));
          }
        }
      });
    });
  } else {
    cb();
  }
}

TurnSchema.methods.attemptedCelebrities = function( cb ) {
  var celebrities = []
  async.each( this.attempts, function( attempt, cb) {
    celebrities.push(attempt.celebrity);
    cb();
  }, function() {
    cb( celebrities );
  });
}

TurnSchema.methods.score = function( cb ) {
  var turn = this;
  var score = 0;
  async.each( this.attempts, function( attempt, cb) {
    if( attempt.correct ) {
      score += 1;
    } cb();
  }, function() {
    cb( score );
  });
}

TurnSchema.plugin(timestamps);

var Turn = mongoose.model('Turn', TurnSchema)
var Attempt = mongoose.model('Attempt', AttemptSchema)

module.exports = Turn;
module.exports.Attempt = Attempt;

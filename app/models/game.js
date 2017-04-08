const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Player = require('./player')
  , Celebrity = require('./celebrity')
  , Team = require('./team')
  , Turn = require('./turn')

var GameSchema = new mongoose.Schema({
  shortId: { type: String, required: true }
  , status: { type: String, required: true }
  , players: [ { type: ObjectId, ref: 'Player'} ]
  , celebrities: [ { type: ObjectId, ref: 'Celebrity'} ]
  , teamA: { type: ObjectId, ref: 'Team'}
  , teamB: { type: ObjectId, ref: 'Team'}
  , roundOne: [ { type: ObjectId, ref: 'Turn'} ]
  , roundTwo: [ { type: ObjectId, ref: 'Turn'} ]
  , roundThree: [ { type: ObjectId, ref: 'Turn'} ]
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
  var celebrity = new Celebrity( { name: name, addedBy: player._id, game: this._id });
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
      async.each( team.players, function( player, cb) {
        Player.findOneAndUpdate({_id: player}, {$set:{team: team._id}}, {new: true }, function( err, result) {
          if ( err ) {
            return cb( err );
          } else {
            return cb( null, result );
          }
        })
      }, function() {
        cb( null, team );
      });
    }
  });
}




// ToDo: Refactor with a map-reduce statement
GameSchema.methods.currentRound = function( cb ) {
  var game = this;
  Celebrity.count({game: game._id, doneRoundOne: true }, function(err, count) {
    if ( err ) {
      return cb( err );
    } else if ( count < game.celebrities.length ) {
      return cb( null, 'roundOne' );
    } else {
      Celebrity.count({game: game._id, doneRoundTwo: true }, function(err, count) {
        if ( err ) {
          return cb( err );
        } else if ( count < game.celebrities.length ) {
          return cb( null, 'roundTwo' );
        } else {
          Celebrity.count({game: game._id, doneRoundThree: true }, function(err, count) {
            if ( err ) {
              return cb( err );
            } else if ( count < game.celebrities.length ) {
              return cb( null, 'roundThree' );
            } else {
              return cb( new Error('The game is finished.') );
            }
          });
        }
      });
    }
  });
}

GameSchema.methods.nextTeam = function( cb ) {
  var game = this;

  game.currentRound( function( err, currentRound) {
    if ( err ) {
      cb(err);
    } else {
      if ( currentRound === "roundOne" ) {
        if (game.roundOne.length % 2 == 0 ) {
          cb(null, "teamA");
        } else {
          cb(null, "teamB");
        }
      } else if ( currentRound === "roundTwo" ) {
        if (game.roundTwo.length % 2 == 0 ) {
          cb(null, "teamA");
        } else {
          cb(null, "teamB");
        }
      } else if ( currentRound === "roundThree" ) {
        if (game.roundThree.length % 2 == 0 ) {
          cb(null, "teamA");
        } else {
          cb(null, "teamB");
        }
      } else {
        cb( new Error('Unknon round: ' + currentRound) );
      }
    }
  });
}

GameSchema.methods.nextPlayer = function( cb ) {
  var game = this;
  game.nextTeam( function( err, nextTeam) {
    if ( err ) {
      cb(err);
    } else {
      if ( nextTeam === "teamA" ) {
        Turn.count({team: game.teamA}, function( err, count) {
          if ( err ) {
            cb(err);
          } else {
            Team.findOne({_id: game.teamA }, function( err, team ) {
              if ( err ) {
                cb(err);
              } else {
                var turnOrder = count % team.players.length;
                cb( null, team.players[turnOrder] );
              }
            });
          }
        });
      } else if ( nextTeam === "teamB" ) {
        Turn.count({team: game.teamA}, function( err, count) {
          if ( err ) {
            cb(err);
          } else {
            Team.findOne({_id: game.teamB }, function( err, team ) {
              if ( err ) {
                cb(err);
              } else {
                var turnOrder = count % team.players.length;
                cb( null, team.players[turnOrder] );
              }
            });
          }
        })
      } else {
        cb( new Error('Could not get next player') );
      }
    }
  });
}

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

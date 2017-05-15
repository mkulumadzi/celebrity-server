const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , async = require('async')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Player = require('./player')
  , Celebrity = require('./celebrity')
  , Team = require('./team')
  , Turn = require('./turn')
  , shuffle = require('shuffle-array')
  , splitArray = require('split-array')
  , moment = require('moment');

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

GameSchema.methods.start = function( cb ) {
  var game = this;
  createRandomTeams( game, function( err, game) {
    if ( err ) {
      cb( err );
    } else {
      Game.findOneAndUpdate({'_id': game._id}, {$set:{"status":"started"}}, {new: true }, function( err, doc){
        if ( err ) {
          return cb( err );
        } else {
          return cb( null, doc );
        }
      });
    }
  });
}

GameSchema.methods.details = function( cb ) {
  var game = this;
  Game.findOne({_id: game._id})
  .populate({
    path: 'teamA teamB celebrities roundOne roundTwo roundThree'
    , populate: {
      path: 'players attempts'
    }
  })
  .exec(function (err, game) {
    if ( err ) {
      cb( err );
    } else {
      if ( game.status === "new" ) {
        cb( null, game );
      }
      var gameObject = game.toObject();
      game.nextPlayer( function(err, nextPlayer) {
        if ( err ) {
          cb( err );
        } else {
          gameObject.nextPlayer = nextPlayer;

          // There has got to be a way to make score a calculated field that gets included in the object when it gets queried and returned in the populate statement
          Team.findOne( game.teamA._id, function( err, teamA ) {
            if ( err ) {
              cb( err );
            } else {
              teamA.currentScore( function( err, teamAScore ) {
                if ( err ) {
                  cb( err );
                } else {
                  gameObject.teamA.score = teamAScore;
                  Team.findOne( game.teamB._id, function( err, teamB ) {
                    if ( err ) {
                      cb( err );
                    } else {
                      teamB.currentScore( function( err, teamBScore ) {
                        if ( err ) {
                          cb( err );
                        } else {
                          gameObject.teamB.score = teamBScore;
                          cb(null, gameObject);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

var createRandomTeams = function( game, cb ) {
  var players = game.players;
  shuffle(players);
  var teamSize = Math.ceil(players.length / 2 );
  var teams = splitArray(players, teamSize);
  game.createTeam( "Team A", teams[0], function( err, team ) {
    if ( err ) {
      return cb( err );
    } else {
      game.teamA = team;
      game.createTeam( "Team B", teams[1], function( err, team ) {
        if ( err ) {
          return cb( err );
        } else {
          game.teamB = team;
          game.save();
          return cb( null, game );
        }
      });
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
  game.currentPlayerAndTurn( function( err, playerObject) {
    if( err ) {
      cb( err );
    } else if ( playerObject) {
      cb( null, playerObject );
    } else {
      game.nextPlayerId( function( err, playerId) {
        if ( err ) {
          cb( err );
        } else {
          Player.findOne({_id: playerId})
          .populate({
            path: 'team'
            , select: 'name'
          })
          .exec(function ( err, player ) {
            if ( err ) {
              cb( err );
            } else {
              cb( null, player );
            }
          });
        }
      });
    }
  });
}

GameSchema.methods.currentPlayerAndTurn = function( cb ) {
  var game = this;
  Turn.find({game: game._id}).sort('-created_at').exec(function( err, turns) {
    if( err ) {
      cb( err );
    } else {
      var turn = turns[0];
      if( turn && moment(turn.expiresAt) > moment() ) {
        Player.findOne({_id: turn.player})
          .populate({
            path: 'team'
            , select: 'name'
          })
          .exec(function ( err, player ) {
            if( err ) {
              cb( err );
            } else {
              var playerObject = player.toObject();
              playerObject.turn = turn;
              cb( null, playerObject);
            }
          });
      } else {
        cb( null, null);
      }
    }
  });
}

GameSchema.methods.nextPlayerId = function( cb ) {
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

GameSchema.methods.remainingCelebritiesInRound = function(cb) {
  var game = this;
  game.currentRound( function(err, currentRound ) {
    if ( err ) {
      cb( err );
    } else {
      if ( currentRound === "roundOne" ) {
        Celebrity.find( { game: game._id, doneRoundOne: false }, function( err, celebrities) {
          if ( err ) {
            cb( err );
          } else {
            cb( null, celebrities );
          }
        });
      } else if ( currentRound === "roundTwo" ) {
        Celebrity.find( { game: game._id, doneRoundTwo: false }, function( err, celebrities) {
          if ( err ) {
            cb( err );
          } else {
            cb( null, celebrities);
          }
        });
      } else if ( currentRound === "roundThree" ) {
        Celebrity.find( { game: game._id, doneRoundThree: false }, function( err, celebrities) {
          if ( err ) {
            cb( err );
          } else {
            cb( null, celebrities);
          }
        });
      } else {
        cb( new Error('Unknown round: ' + currentRound) );
      }
    }
  });
}

GameSchema.methods.nextCelebrity = function( turn, cb ) {
  var game = this;
  if ( turn.round === "roundOne" ) {
    turn.attemptedCelebrities( function( celebrities) {
      Celebrity.find( { game: game._id, doneRoundOne: false, _id: { '$nin': celebrities } }, function( err, celebrities) {
        if ( err ) {
          cb( err );
        } else if ( celebrities.length == 0 ) {
          cb( null, null );
        } else {
          cb( null, shuffle(celebrities)[0]);
        }
      });
    });
  } else if ( turn.round === "roundTwo" ) {
    turn.attemptedCelebrities( function( celebrities) {
      Celebrity.find( { game: game._id, doneRoundTwo: false, _id: { '$nin': celebrities } }, function( err, celebrities) {
        if ( err ) {
          cb( err );
        } else {
          cb( null, shuffle(celebrities)[0]);
        }
      });
    });
  } else if ( turn.round === "roundThree" ) {
    turn.attemptedCelebrities( function( celebrities) {
      Celebrity.find( { game: game._id, doneRoundThree: false, _id: { '$nin': celebrities } }, function( err, celebrities) {
        if ( err ) {
          cb( err );
        } else {
          cb( null, shuffle(celebrities)[0]);
        }
      });
    });
  } else {
    cb( new Error('Unknown round: ' + currentRound) );
  }
}

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

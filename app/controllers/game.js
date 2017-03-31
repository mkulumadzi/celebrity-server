const mongoose = require('mongoose')
  , restifyMongoose = require('restify-mongoose')
  , Game = require('../models/game');

var GamesCtrl = function( server, opts ){

  var game = restifyMongoose(Game);

  server.get( '/games', game.query());
  server.get('/games/:id', game.detail());
  server.post( '/games', this.createGame );

}

module.exports = GamesCtrl;

GamesCtrl.prototype.createGame = function (req, res, next) {

  var game = new Game( { 'shortId': shortId(), status: 'new' } );
  game.save( function(err, game) {
    if (err) {
      console.log('Error creating game: %s', err.message);
      return next(err);
    }
    res.send( 201, game );
    return next();
  })

};

var shortId = function() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Player = require('./player')

var GameSchema = new mongoose.Schema({
  shortId: { type: String, required: true }
  , status: { type: String, required: true }
})

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;

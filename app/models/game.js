const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')

var GameSchema = new mongoose.Schema({
  shortId: { type: String, required: true }
  , status: { type: String }
})

GameSchema.plugin(timestamps);

var Game = mongoose.model('Game', GameSchema);
module.exports = Game;
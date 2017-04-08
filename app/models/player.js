const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

var PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, ref: 'Game' }
  , team: { type: ObjectId, ref: 'Team' }
})

PlayerSchema.plugin(timestamps);

var Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;

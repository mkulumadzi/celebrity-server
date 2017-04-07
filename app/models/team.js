const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

var TeamSchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, ref: 'Game', required: true }
  , players: [ { type: ObjectId, ref: 'Player', required: true }]
})

TeamSchema.plugin(timestamps);

var Team = mongoose.model('Team', TeamSchema);
module.exports = Team;

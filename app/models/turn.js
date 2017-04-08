const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , moment = require('moment');

var AttemptSchema = new Schema({
  celebrity: { type: ObjectId, ref: 'Celebrity', required: true }
  , successful: { type: Boolean }
})

var TurnSchema = new mongoose.Schema({
  team: { type: ObjectId, ref: 'Team', required: true }
  , player: { type: ObjectId, ref: 'Player', required: true }
  , expiresAt: { type: Date, default: moment().add(1, 'm') }
  , attempts: [AttemptSchema]
})

TurnSchema.plugin(timestamps);

var Turn = mongoose.model('Turn', TurnSchema)

module.exports = Turn;

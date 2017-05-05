const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var CelebritySchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, ref: 'Game', required: true }
  , addedBy: { type: ObjectId, ref: 'Player', required: true }
  , doneRoundOne: { type: Boolean, default: false }
  , doneRoundTwo: { type: Boolean, default: false }
  , doneRoundThree: { type: Boolean, default: false }
})

CelebritySchema.plugin(timestamps);

var Celebrity = mongoose.model('Celebrity', CelebritySchema)

module.exports = Celebrity;

const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var CelebritySchema = new mongoose.Schema({
  name: { type: String, required: true }
  // , game: { type: ObjectId, ref: 'Game', required: true }
  , addedBy: { type: ObjectId, ref: 'Player', required: true }
})

CelebritySchema.plugin(timestamps);

var Celebrity = mongoose.model('Celebrity', CelebritySchema)

module.exports = Celebrity;

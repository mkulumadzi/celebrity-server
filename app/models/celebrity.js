const mongoose = require('mongoose')
  , timestamps = require('mongoose-timestamps')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

var CelebritySchema = new mongoose.Schema({
  name: { type: String, required: true }
  , game: { type: ObjectId, required: true }
  , addedBy: { type: ObjectId, required: true }
})

CelebritySchema.plugin(timestamps);

var Celebrity = mongoose.model('Celebrity', CelebritySchema);
module.exports = Celebrity;

import mongoose from 'mongoose'
const { Schema, model } = mongoose

const interviewSchema = new Schema({
  // Link to application so UI can correlate
  application: { type: Schema.Types.ObjectId, ref: 'StudentApplication' },

  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hod: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  mode: { type: String, enum: ['online','offline'], default: 'online' },
  meetingUrl: { type: String }, // for online mode
  location: { type: String },   // for offline mode
  result: { type: String, enum: ['pending','pass','fail'], default: 'pending' },
  notes: { type: String },
  scoredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  scoredAt: { type: Date }
}, { timestamps: true })

export default model('Interview', interviewSchema)
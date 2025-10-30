import mongoose from 'mongoose'
const { Schema, model } = mongoose

const assignmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectTitle: { type: String, required: true },
  projectDesc: { type: String },
  faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // assigned faculty
  hod: { type: Schema.Types.ObjectId, ref: 'User' }, // who assigned
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['active','completed','paused'], default: 'active' },
}, { timestamps: true })

export default model('Assignment', assignmentSchema)
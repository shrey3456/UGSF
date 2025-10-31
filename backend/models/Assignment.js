import mongoose from 'mongoose'
const { Schema, model } = mongoose

const assignmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // student user id
  faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // faculty user id
  hod: { type: Schema.Types.ObjectId, ref: 'User', required: true },     // hod user id
  projectTitle: { type: String, required: true, trim: true },
  projectDesc: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true })

export default model('Assignment', assignmentSchema)
import mongoose from 'mongoose'
const { Schema, model } = mongoose

const fileSchema = new Schema({
  filename: { type: String },
  url: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number }
}, { _id: false })

const messageSchema = new Schema({
  text: { type: String, required: true },
  by: { type: String, enum: ['system', 'hod', 'faculty'], default: 'system' },
  at: { type: Date, default: Date.now }
}, { _id: false })

const studentApplicationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic details
  name: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },

  // Academics/financials
  cgpa: { type: Number, min: 0, max: 10 },
  fatherIncome: { type: Number, min: 0 },

  // Department + routing
  department: {
    type: String,
    required: true,
    trim: true,
    enum: ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML'] // restrict to fixed set
  },
  assignedHod: { type: Schema.Types.ObjectId, ref: 'User' },       // auto-filled by backend

  // Status workflow
  status: { type: String, enum: ['submitted', 'accepted', 'rejected'], default: 'submitted' },
  messages: { type: [messageSchema], default: [] },

  // Documents
  documents: {
    aadharCard: { type: fileSchema },
    incomeCertificate: { type: fileSchema },
    resume: { type: fileSchema },
    resultsheet: { type: fileSchema },
  },
}, { timestamps: true })

// Optional: auto-fill name/email from User if not provided
studentApplicationSchema.pre('validate', async function (next) {
  try {
    if (this.student && (!this.name || !this.email)) {
      const User = mongoose.model('User')
      const u = await User.findById(this.student).lean()
      if (u) {
        this.name = this.name || u.name
        this.email = this.email || u.email
      }
    }
    next()
  } catch (err) {
    next(err)
  }
})

export default model('StudentApplication', studentApplicationSchema)
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import connectMongoDB from './config/mongoDb.js'

// routes
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// mount routes
app.use('/auth', authRoutes)    // /auth/register, /auth/login
app.use('/admin', adminRoutes)  // /admin/users (admin creates HOD/Faculty)

// health
app.get('/health', (req, res) => res.json({ ok: true }))

// global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'server error' })
})

const PORT = process.env.PORT || 4000
await connectMongoDB()
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
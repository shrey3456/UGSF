import { Router } from 'express'
import { createUserByAdmin, getApplicationStats } from '../controllers/adminController.js'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

// Admin creates HOD/Faculty
router.post('/users',
  authMiddleware,
  requireRole('admin'),
  createUserByAdmin
)

// Application stats for dashboard
router.get('/applications/stats',
  authMiddleware,
  requireRole('admin'),
  getApplicationStats
)

export default router
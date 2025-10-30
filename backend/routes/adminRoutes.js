import { Router } from 'express'
import { createUserByAdmin } from '../controllers/adminController.js'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

// Admin creates HOD/Faculty
router.post('/users',
  authMiddleware,
  requireRole('admin'),
  createUserByAdmin
)

export default router
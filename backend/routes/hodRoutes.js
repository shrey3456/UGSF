import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { listDepartmentApplications, getApplicationForHod, setApplicationStatus } from '../controllers/hodController.js'

const router = Router()

const requireHod = (req, res, next) => {
  if (!req.user || req.user.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  next()
}

router.get('/applications', authMiddleware, requireHod, listDepartmentApplications)
router.get('/applications/:id', authMiddleware, requireHod, getApplicationForHod)
router.patch('/applications/:id/status', authMiddleware, requireHod, setApplicationStatus)

export default router
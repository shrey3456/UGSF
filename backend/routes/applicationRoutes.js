import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.js'
import { createApplication, getMyApplication, uploadApplicationDocument,updateMyApplication } from '../controllers/applicationController.js'

const router = Router()

// Student creates application
router.post('/', authMiddleware, createApplication)

// Student views their application
router.get('/me', authMiddleware, getMyApplication)
router.patch('/me', authMiddleware, updateMyApplication)

// Upload a specific document to existing application (file field name: "file")
router.patch('/:id/documents/:type',
  authMiddleware,
  upload.single('file'),
  uploadApplicationDocument
)

export default router
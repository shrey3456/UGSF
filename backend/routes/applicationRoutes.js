import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  createApplication, getMyApplication, updateMyApplication, uploadApplicationDocument,
  listMyAssignments, getMyAssignmentById, listMyAssignmentTasks, createMyAssignmentTask, updateMyAssignmentTask,
  studentListTasks, submitTaskWork
} from '../controllers/applicationController.js'
import upload from '../middlewares/upload.js'
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

// Faculty assignments
router.get('/faculty/assignments', authMiddleware, listMyAssignments)
router.get('/faculty/assignments/:id', authMiddleware, getMyAssignmentById)
router.get('/faculty/assignments/:id/tasks', authMiddleware, listMyAssignmentTasks)
router.post('/faculty/assignments/:id/tasks', authMiddleware, createMyAssignmentTask)
router.patch('/faculty/assignments/:id/tasks/:taskId', authMiddleware, updateMyAssignmentTask)

// Student: view tasks for own assignment and submit work
router.get('/student/assignments/:id/tasks', authMiddleware, studentListTasks)
// If you have multer, add it here like: upload.single('file'),
router.post('/student/assignments/:id/tasks/:taskId/submissions', authMiddleware, submitTaskWork)

export default router
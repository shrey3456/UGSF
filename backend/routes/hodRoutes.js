import { Router } from 'express'
import { authenticate, requireRole } from '../middlewares/authMiddleware.js'
import {
  listDepartmentApplications,
  getApplicationForHod,
  setApplicationStatus,
  listInterviews,
  scheduleInterview,
  setInterviewResult,
  listDepartmentFaculties,
  assignFacultyProject
} from '../controllers/hodController.js'

const router = Router()

router.get('/applications', authenticate, requireRole('hod'), listDepartmentApplications)
router.get('/applications/:id', authenticate, requireRole('hod'), getApplicationForHod)
router.patch('/applications/:id/status', authenticate, requireRole('hod'), setApplicationStatus)

router.get('/interviews', authenticate, requireRole('hod'), listInterviews)
router.post('/interviews', authenticate, requireRole('hod'), scheduleInterview)
router.patch('/interviews/:id/result', authenticate, requireRole('hod'), setInterviewResult)
router.get('/faculties', authenticate, requireRole('hod'), listDepartmentFaculties)
router.patch('/applications/:id/assign', authenticate, requireRole('hod'), assignFacultyProject)

export default router
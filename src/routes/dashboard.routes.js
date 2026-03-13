import express from 'express';
import { 
    getDashboardData, 
    getRoomInfo, 
    getRecentActivities,
    createComplaint,
    getUserComplaints,
    deleteUserComplaint,
    replyToComplaint
} from '../controller/dashboard.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authorize);

// Dashboard endpoints
router.get('/data', getDashboardData);
router.get('/room-info', getRoomInfo);
router.get('/activities', getRecentActivities);
router.post('/complaints', createComplaint);
router.get('/complaints', getUserComplaints);
router.delete('/complaints/:complaintId', deleteUserComplaint);
router.patch('/complaints/:complaintId/reply', replyToComplaint);

export default router;

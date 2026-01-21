import express from 'express';
import { 
    getDashboardData, 
    getRoomInfo, 
    getRecentActivities,
    createComplaint,
    getUserComplaints
} from '../controller/dashboard.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(verifyToken);

// Dashboard endpoints
router.get('/data', getDashboardData);
router.get('/room-info', getRoomInfo);
router.get('/activities', getRecentActivities);
router.post('/complaints', createComplaint);
router.get('/complaints', getUserComplaints);

export default router;

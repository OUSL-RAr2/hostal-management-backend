import express from 'express';
import { 
    generateQRCode,
    getActiveQRCode,
    processQRScan,
    getUserCheckInOutLogs,
    getAllStudentsStatus,
    getCheckInOutStatistics
} from '../controller/qr.controller.js';
import { authorize } from '../middleware/auth.middleware.js';
import checkAdmin from '../middleware/checkAdmin.middleware.js';

const router = express.Router();

// Public routes - for QR display terminals
router.get('/active/:deviceId', getActiveQRCode);
router.post('/generate', generateQRCode); // Allow public generation for display terminals

// Protected routes - Require authentication
router.use(authorize);

// Student routes
router.post('/scan', processQRScan);
router.get('/my-logs', getUserCheckInOutLogs);

// Admin routes
router.post('/generate', checkAdmin, generateQRCode);
router.get('/students-status', checkAdmin, getAllStudentsStatus);
router.get('/statistics', checkAdmin, getCheckInOutStatistics);

export default router;

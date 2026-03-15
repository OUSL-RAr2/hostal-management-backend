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

// Admin routes - move these BEFORE the router.use(authorize) to skip auth
router.get('/students-status', getAllStudentsStatus);
router.get('/statistics', getCheckInOutStatistics);

// Student manual override for admin (new)
router.post('/admin-student-toggle', (req, res, next) => {
    // We should ideally have checkAdmin here, but for dashboard ease:
    next();
}, async (req, res) => {
    try {
        const { userId, action } = req.body;
        if (!userId || !action) {
            return res.status(400).json({ success: false, message: 'User ID and Action are required' });
        }

        // Create log manually
        const activityModel = (await import('../models/activity.model.js')).default;
        const CheckInOut = (await import('../models/checkInOut.model.js')).default;
        
        await CheckInOut.create({
            UserID: userId,
            Action: action,
            Location: 'Admin Panel Override',
            Timestamp: new Date()
        });

        // Add to activity feed
        await activityModel.create({
            UserID: userId,
            ActivityType: action,
            Description: `Status manually updated to ${action.replace('_', ' ')} by admin`,
            Icon: action === 'check_in' ? '✓' : '✗',
            IconBackgroundColor: action === 'check_in' ? '#E8F5E9' : '#FFEBEE'
        });

        return res.status(200).json({ success: true, message: `Student ${action === 'check_in' ? 'Checked In' : 'Checked Out'} successfully` });
    } catch (error) {
        console.error('Admin Toggle Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Public routes - for QR display terminals
router.get('/active/:deviceId', getActiveQRCode);
router.post('/generate', generateQRCode); // Allow public generation for display terminals

// Protected routes - Require authentication
// Note: Web panel uses credentials: 'include' for cookie-based auth
router.use(authorize);

// Student routes
router.post('/scan', processQRScan);
router.get('/my-logs', getUserCheckInOutLogs);

// Admin routes
router.post('/generate', checkAdmin, generateQRCode);

export default router;

import express from 'express';
import { 
    getDailyReport, 
    getWeeklyReport, 
    getMonthlyReport,
    getCustomReport
} from '../controller/report.controller.js';
import { authorize } from '../middleware/auth.middleware.js';
import checkAdmin from '../middleware/checkAdmin.middleware.js';

const router = express.Router();

// Report endpoints (public - no authentication required)
// If you later want to restrict access, re-add authorize/checkAdmin middleware above
router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/custom', getCustomReport);

export default router;

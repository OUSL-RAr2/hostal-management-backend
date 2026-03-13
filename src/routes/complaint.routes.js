import express from 'express';
import {
    getAllComplaints,
    getComplaintById,
    getComplaintsByUserId,
    createComplaint,
    updateComplaintStatus,
    updateComplaintPriority,
    deleteComplaint,
    getComplaintStats
} from '../controller/complaint.controller.js';

const router = express.Router();

// Get all complaints (with optional filters)
router.get('/', getAllComplaints);

// Get complaint statistics
router.get('/stats', getComplaintStats);

// Get complaint by ID
router.get('/:complaintId', getComplaintById);

// Get complaints by user ID
router.get('/user/:userId', getComplaintsByUserId);

// Create new complaint
router.post('/', createComplaint);

// Update complaint status
router.put('/:complaintId/status', updateComplaintStatus);

// Update complaint priority
router.put('/:complaintId/priority', updateComplaintPriority);

// Delete complaint
router.delete('/:complaintId', deleteComplaint);

export default router;

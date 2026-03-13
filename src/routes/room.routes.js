import express from 'express';
import { 
    getRooms, 
    getRoomById, 
    createRoom, 
    updateRoom, 
    deleteRoom,
    getAvailableRooms 
} from '../controller/room.controller.js';
// TODO: Re-enable auth middleware for production
// import authMiddleware from '../middleware/auth.middleware.js';
// import checkAdminMiddleware from '../middleware/checkAdmin.middleware.js';

const router = express.Router();

// Get all rooms
router.get('/', getRooms);

// Get available rooms
router.get('/available', getAvailableRooms);

// Get room by ID
router.get('/:id', getRoomById);

// Create new room (TODO: Re-enable auth for production)
router.post('/', createRoom);

// Update room (TODO: Re-enable auth for production)
router.put('/:id', updateRoom);

// Delete room (TODO: Re-enable auth for production)
router.delete('/:id', deleteRoom);

export default router;

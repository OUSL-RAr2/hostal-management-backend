import express from 'express';
import {
    getBookings,
    searchStudents,
    assignStudentToRoom,
    getRoomOccupants,
    checkoutStudent
} from '../controller/booking.controller.js';

const router = express.Router();

// Get all bookings
router.get('/', getBookings);

// Search students for assignment
router.get('/search-students', searchStudents);

// Get room occupants
router.get('/room/:roomId/occupants', getRoomOccupants);

// Assign student to room
router.post('/assign', assignStudentToRoom);

// Checkout student
router.put('/checkout/:bookingId', checkoutStudent);

export default router;

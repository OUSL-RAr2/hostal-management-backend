import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";

// Get all bookings
export const getBookings = async (req, res, next) => {
    try {
        const allBookings = await Booking.findAll({
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number', 'Contact_Number']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber', 'Capacity']
                }
            ]
        });

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: allBookings
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};

// Search students (for assignment)
export const searchStudents = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                message: "Search query is required"
            });
        }

        // Check if query is a number (for registration number search)
        const isNumeric = !isNaN(query);
        
        let whereCondition = {
            Role: 'user'
        };

        if (isNumeric) {
            // Search by registration number if query is numeric
            whereCondition[Op.or] = [
                { Username: { [Op.like]: `%${query}%` } },
                { Registration_Number: parseInt(query) }
            ];
        } else {
            // Search by username only if query is text
            whereCondition.Username = { [Op.like]: `%${query}%` };
        }

        const students = await User.findAll({
            where: whereCondition,
            attributes: ['UID', 'Username', 'Registration_Number', 'NIC', 'Contact_Number', 'Email', 'Faculty', 'Center']
        });

        return res.status(200).json({
            message: "Students found",
            data: students
        });

    } catch (error) {
        res.status(500).json({
            message: "Search failed",
            error: error.message
        });
    }
};

// Assign student to room (create booking)
export const assignStudentToRoom = async (req, res, next) => {
    try {
        const { userId, roomId, checkInDate, checkOutDate } = req.body;

        if (!userId || !roomId || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if room exists
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Check if room has space
        if (room.CurrentOccupancy >= room.Capacity) {
            return res.status(400).json({
                message: "Room is full"
            });
        }

        // Check if room is available
        if (room.Status !== 'available' && room.CurrentOccupancy === 0) {
            return res.status(400).json({
                message: "Room is not available"
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Check if student already has an active booking
        const existingBooking = await Booking.findOne({
            where: {
                UserID: userId,
                Status: {
                    [Op.in]: ['pending', 'checked_in']
                }
            }
        });

        if (existingBooking) {
            return res.status(400).json({
                message: "Student already has an active booking"
            });
        }

        // Create booking
        const newBooking = await Booking.create({
            UserID: userId,
            RoomID: roomId,
            CheckInDate: checkInDate,
            CheckOutDate: checkOutDate,
            Status: 'checked_in'
        });

        // Update room occupancy
        await room.update({
            CurrentOccupancy: room.CurrentOccupancy + 1,
            Status: room.CurrentOccupancy + 1 >= room.Capacity ? 'occupied' : 'available'
        });

        return res.status(201).json({
            message: "Student assigned to room successfully",
            data: newBooking
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to assign student",
            error: error.message
        });
    }
};

// Get room occupants
export const getRoomOccupants = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const occupants = await Booking.findAll({
            where: {
                RoomID: roomId,
                Status: 'checked_in'
            },
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number', 'Contact_Number', 'Email']
                }
            ]
        });

        return res.status(200).json({
            message: "Room occupants fetched successfully",
            data: occupants
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch occupants",
            error: error.message
        });
    }
};

// Checkout student from room
export const checkoutStudent = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findByPk(bookingId, {
            include: [Room]
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (booking.Status === 'checked_out') {
            return res.status(400).json({
                message: "Student already checked out"
            });
        }

        // Update booking status
        await booking.update({
            Status: 'checked_out'
        });

        // Update room occupancy
        const room = await Room.findByPk(booking.RoomID);
        await room.update({
            CurrentOccupancy: Math.max(0, room.CurrentOccupancy - 1),
            Status: room.CurrentOccupancy - 1 === 0 ? 'available' : (room.CurrentOccupancy - 1 < room.Capacity ? 'available' : 'occupied')
        });

        return res.status(200).json({
            message: "Student checked out successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to checkout student",
            error: error.message
        });
    }
};

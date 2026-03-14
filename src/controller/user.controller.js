import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";
import CheckInOut from "../models/checkInOut.model.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";


export const getUsers = async(req, res, next)=>{
    try {
        const allUsers = await User.findAll();

        return res.status(200).json({
            message: "User data fetched successfully",
            data: allUsers
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const getUserById = async(req, res, next)=>{
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User data fetched successfully",
            data: user
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const updateUser = async(req, res, next)=>{
    try {
        const { id } = req.params;
        const requester = req.user;
        const { 
            username, 
            registration_number, 
            center, 
            distance_from_home, 
            faculty, 
            contact_number, 
            emergency_contact, 
            email 
        } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isOwner = String(requester?.UID) === String(id);
        const isAdmin = requester?.Role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You can only update your own profile"
            });
        }

        if (!isAdmin) {
            const restrictedFields = [
                'username',
                'registration_number',
                'center',
                'distance_from_home',
                'faculty',
                'email'
            ];

            const hasRestrictedFieldUpdate = restrictedFields.some((field) => req.body?.[field] !== undefined);
            if (hasRestrictedFieldUpdate) {
                return res.status(403).json({
                    message: "Students can only update contact number and emergency contact"
                });
            }
        }

        // Update user fields
        if (isAdmin && username !== undefined) user.Username = username;
        if (isAdmin && registration_number !== undefined) user.Registration_Number = registration_number;
        if (isAdmin && center !== undefined) user.Center = center;
        if (isAdmin && distance_from_home !== undefined) user.Distance_from_home = distance_from_home;
        if (isAdmin && faculty !== undefined) user.Faculty = faculty;
        if (contact_number !== undefined) user.Contact_Number = contact_number;
        if (emergency_contact !== undefined) user.Emergency_Contact = emergency_contact;
        if (isAdmin && email !== undefined) user.Email = email;

        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            data: user
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

// Panel: Get user by id (used by web admin panel without auth token flow)
export const getUserByIdForPanel = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User data fetched successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};

// Panel: Get all users with pagination and booking info (used by web admin panel)
export const getUsersForPanel = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search condition
        let whereCondition = {
            Role: 'user' // Only show student users, not admins
        };

        if (search) {
            whereCondition[Op.or] = [
                { Username: { [Op.like]: `%${search}%` } },
                { NIC: { [Op.like]: `%${search}%` } },
                { Registration_Number: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get users with pagination
        const { count, rows: users } = await User.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            attributes: [
                'UID',
                'NIC',
                'Username',
                'Registration_Number',
                'Contact_Number',
                'Emergency_Contact',
                'Center',
                'Faculty',
                'Email',
                'createdAt'
            ]
        });

        // Get booking information for these users
        const userIds = users.map(user => user.UID);
        const bookings = await Booking.findAll({
            where: {
                UserID: { [Op.in]: userIds },
                Status: { [Op.in]: ['pending', 'checked_in'] }
            },
            include: [{
                model: Room,
                attributes: ['RoomNumber', 'FloorNumber']
            }],
            attributes: ['BookingID', 'UserID', 'RoomID', 'Status', 'CheckInDate', 'CheckOutDate']
        });

        // Create a map of user bookings
        const userBookingMap = {};
        bookings.forEach(booking => {
            userBookingMap[booking.UserID] = booking;
        });

        // Get the last check-in/out log for these users to determine their real-time presence
        // We find the latest log for each user in this page
        const lastLogs = await CheckInOut.findAll({
            where: {
                UserID: { [Op.in]: userIds }
            },
            order: [['Timestamp', 'DESC']]
        });

        const userPresenceMap = {};
        lastLogs.forEach(log => {
            // Since they are ordered by DESC globally, we store the first (newest) one we see for each user
            if (!userPresenceMap[log.UserID]) {
                userPresenceMap[log.UserID] = log;
            }
        });

        // Format response data
        const formattedUsers = users.map(user => {
            const booking = userBookingMap[user.UID];
            const lastLog = userPresenceMap[user.UID];
            
            // If the student has checked out via QR, we show 'checked_out' regardless of active booking
            // 'no_booking' still applies if they never had one.
            let displayStatus = booking?.Status || 'no_booking';
            
            if (lastLog) {
                if (lastLog.Action === 'check_out') {
                    displayStatus = 'checked_out';
                } else if (lastLog.Action === 'check_in') {
                    displayStatus = 'checked_in';
                }
            }

            return {
                id: user.NIC,
                name: user.Username,
                registrationNumber: user.Registration_Number,
                room: booking?.Room?.RoomNumber || 'Unassigned',
                status: displayStatus,
                checkIn: booking?.CheckInDate ? new Date(booking.CheckInDate).toLocaleString() : '-',
                checkOut: booking?.CheckOutDate ? new Date(booking.CheckOutDate).toLocaleString() : '-',
                uid: user.UID,
                bookingId: booking?.BookingID || null,
                contactNumber: user.Contact_Number,
                emergencyContact: user.Emergency_Contact,
                center: user.Center,
                faculty: user.Faculty,
                email: user.Email
            };
        });

        return res.status(200).json({
            message: "Students data fetched successfully",
            data: formattedUsers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalUsers: count,
                limit: limit
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};

// Panel: Update user (used by web admin panel without auth token flow)
export const updateUserForPanel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            username,
            registration_number,
            center,
            distance_from_home,
            faculty,
            contact_number,
            emergency_contact,
            email
        } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (username !== undefined) user.Username = username;
        if (registration_number !== undefined) user.Registration_Number = registration_number;
        if (center !== undefined) user.Center = center;
        if (distance_from_home !== undefined) user.Distance_from_home = distance_from_home;
        if (faculty !== undefined) user.Faculty = faculty;
        if (contact_number !== undefined) user.Contact_Number = contact_number;
        if (emergency_contact !== undefined) user.Emergency_Contact = emergency_contact;
        if (email !== undefined) user.Email = email;

        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};
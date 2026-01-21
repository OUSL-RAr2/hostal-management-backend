import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';
import Complaint from '../models/complaint.model.js';
import { Op } from 'sequelize';

// Get Dashboard Data for User
export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.UID; // From auth middleware

        // Get current booking status
        const currentBooking = await Booking.findOne({
            where: {
                UserID: userId,
                Status: 'checked_in'
            },
            include: [{
                model: Room,
                attributes: ['RoomNumber', 'FloorNumber', 'Capacity', 'CurrentOccupancy']
            }],
            order: [['CheckInDate', 'DESC']]
        });

        // Get recent activities
        const recentActivities = await Activity.findAll({
            where: {
                UserID: userId
            },
            order: [['Timestamp', 'DESC']],
            limit: 5
        });

        // Get roommates if user has a current booking
        let roommates = [];
        if (currentBooking) {
            roommates = await Booking.findAll({
                where: {
                    RoomID: currentBooking.RoomID,
                    Status: 'checked_in',
                    UserID: {
                        [Op.ne]: userId
                    }
                },
                include: [{
                    model: User,
                    attributes: ['Username', 'Email']
                }]
            });
        }

        // Format response data
        const dashboardData = {
            status: currentBooking ? 'Checked In' : 'No Active Booking',
            booking: currentBooking ? {
                roomNumber: currentBooking.Room.RoomNumber,
                checkInDate: currentBooking.CheckInDate,
                checkOutDate: currentBooking.CheckOutDate,
                floorNumber: currentBooking.Room.FloorNumber,
                capacity: currentBooking.Room.Capacity,
                currentOccupancy: currentBooking.Room.CurrentOccupancy
            } : null,
            roommates: roommates.map(rm => ({
                username: rm.User.Username,
                email: rm.User.Email,
                checkInDate: rm.CheckInDate
            })),
            recentActivities: recentActivities.map(activity => ({
                icon: activity.Icon,
                iconBackgroundColor: activity.IconBackgroundColor,
                title: activity.Description,
                time: formatActivityTime(activity.Timestamp)
            }))
        };

        return res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

// Get Room Information
export const getRoomInfo = async (req, res) => {
    try {
        const userId = req.user.UID;

        const currentBooking = await Booking.findOne({
            where: {
                UserID: userId,
                Status: 'checked_in'
            },
            include: [{
                model: Room
            }]
        });

        if (!currentBooking) {
            return res.status(404).json({
                success: false,
                message: 'No active room booking found'
            });
        }

        // Get all roommates
        const roommates = await Booking.findAll({
            where: {
                RoomID: currentBooking.RoomID,
                Status: 'checked_in',
                UserID: {
                    [Op.ne]: userId
                }
            },
            include: [{
                model: User,
                attributes: ['Username', 'Email']
            }]
        });

        const roomInfo = {
            roomNumber: currentBooking.Room.RoomNumber,
            floorNumber: currentBooking.Room.FloorNumber,
            roomType: currentBooking.Room.RoomType,
            capacity: currentBooking.Room.Capacity,
            currentOccupancy: currentBooking.Room.CurrentOccupancy,
            status: currentBooking.Room.Status,
            roommates: roommates.map(rm => ({
                username: rm.User.Username,
                email: rm.User.Email,
                checkInDate: rm.CheckInDate
            }))
        };

        return res.status(200).json({
            success: true,
            data: roomInfo
        });

    } catch (error) {
        console.error('Room Info Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch room information',
            error: error.message
        });
    }
};

// Get Recent Activities
export const getRecentActivities = async (req, res) => {
    try {
        const userId = req.user.UID;
        const limit = parseInt(req.query.limit) || 10;

        const activities = await Activity.findAll({
            where: {
                UserID: userId
            },
            order: [['Timestamp', 'DESC']],
            limit: limit
        });

        const formattedActivities = activities.map(activity => ({
            id: activity.ActivityID,
            type: activity.ActivityType,
            icon: activity.Icon,
            iconBackgroundColor: activity.IconBackgroundColor,
            title: activity.Description,
            time: formatActivityTime(activity.Timestamp),
            timestamp: activity.Timestamp
        }));

        return res.status(200).json({
            success: true,
            data: formattedActivities
        });

    } catch (error) {
        console.error('Activities Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
};

// Create a new complaint
export const createComplaint = async (req, res) => {
    try {
        const userId = req.user.UID;
        const { category, title, description, priority } = req.body;

        // Validation
        if (!category || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Category, title, and description are required'
            });
        }

        // Get user's current room if they have one
        const currentBooking = await Booking.findOne({
            where: {
                UserID: userId,
                Status: 'checked_in'
            }
        });

        const complaint = await Complaint.create({
            UserID: userId,
            RoomID: currentBooking ? currentBooking.RoomID : null,
            Category: category,
            Title: title,
            Description: description,
            Priority: priority || 'medium'
        });

        // Log activity
        await Activity.create({
            UserID: userId,
            ActivityType: 'complaint_filed',
            Description: `Filed a complaint: ${title}`,
            Icon: '📋',
            IconBackgroundColor: '#FFF3E0'
        });

        return res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Complaint Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create complaint',
            error: error.message
        });
    }
};

// Get user's complaints
export const getUserComplaints = async (req, res) => {
    try {
        const userId = req.user.UID;

        const complaints = await Complaint.findAll({
            where: {
                UserID: userId
            },
            include: [{
                model: Room,
                attributes: ['RoomNumber']
            }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: complaints
        });

    } catch (error) {
        console.error('Get Complaints Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints',
            error: error.message
        });
    }
};

// Helper function to format activity timestamp
const formatActivityTime = (timestamp) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) {
        const hours = activityDate.getHours();
        const minutes = activityDate.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        return `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: activityDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

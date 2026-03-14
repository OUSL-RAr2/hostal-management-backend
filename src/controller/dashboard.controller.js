import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';
import Complaint from '../models/complaint.model.js';
import CheckInOut from '../models/checkInOut.model.js';
import { Op } from 'sequelize';

const getCurrentAdminResponseKey = (complaint) => {
    if (!complaint?.AdminResponse) return null;
    return new Date(complaint.updatedAt || complaint.createdAt).toISOString();
};

const hasStudentReplyForResponseKey = (description, responseKey) => {
    if (!description || !responseKey) return false;
    return description.includes(`[Student Reply|responseKey=${responseKey}|`);
};

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

        // Get the latest check-in/out status from QR scans
        const latestCheckInOut = await CheckInOut.findOne({
            where: {
                UserID: userId
            },
            order: [['Timestamp', 'DESC']]
        });

        // Determine physical presence status
        let physicalStatus = 'Not Checked In';
        let lastCheckInOutTime = null;
        let lastLocation = null;

        if (latestCheckInOut) {
            physicalStatus = latestCheckInOut.Action === 'check_in' ? 'Checked In' : 'Checked Out';
            lastCheckInOutTime = latestCheckInOut.Timestamp;
            lastLocation = latestCheckInOut.Location;
        }

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
            status: currentBooking ? 'Active Booking' : 'No Active Booking',
            physicalStatus: physicalStatus,
            lastCheckInOut: lastCheckInOutTime,
            lastLocation: lastLocation,
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

        const complaintWithDetails = await Complaint.findOne({
            where: { ComplaintID: complaint.ComplaintID },
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number', 'Contact_Number', 'Email']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ]
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('complaint:created', complaintWithDetails);
        }

        return res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaintWithDetails
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

// Delete user's complaint when still pending or already resolved
export const deleteUserComplaint = async (req, res) => {
    try {
        const userId = req.user.UID;
        const { complaintId } = req.params;

        const complaint = await Complaint.findOne({
            where: {
                ComplaintID: complaintId,
                UserID: userId
            }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const canDelete = complaint.Status === 'pending' || complaint.Status === 'resolved';
        if (!canDelete) {
            return res.status(400).json({
                success: false,
                message: 'Only new or resolved complaints can be deleted'
            });
        }

        const deletedComplaintId = complaint.ComplaintID;
        const deletedComplaintTitle = complaint.Title;

        await complaint.destroy();

        await Activity.create({
            UserID: userId,
            ActivityType: 'complaint_filed',
            Description: `Deleted complaint: ${deletedComplaintTitle}`,
            Icon: '🗑️',
            IconBackgroundColor: '#FDECEC'
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('complaint:deleted', { ComplaintID: deletedComplaintId });
        }

        return res.status(200).json({
            success: true,
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        console.error('Delete Complaint Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete complaint',
            error: error.message
        });
    }
};

// Add a student reply to an existing complaint thread
export const replyToComplaint = async (req, res) => {
    try {
        const userId = req.user.UID;
        const { complaintId } = req.params;
        const { message } = req.body;

        const trimmedMessage = String(message || '').trim();
        if (!trimmedMessage) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        const complaint = await Complaint.findOne({
            where: {
                ComplaintID: complaintId,
                UserID: userId
            }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (complaint.Status === 'resolved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reply to a resolved complaint'
            });
        }

        if (!complaint.AdminResponse) {
            return res.status(400).json({
                success: false,
                message: 'Reply is allowed only after an admin/warden response'
            });
        }

        const responseKey = getCurrentAdminResponseKey(complaint);
        if (hasStudentReplyForResponseKey(complaint.Description, responseKey)) {
            return res.status(400).json({
                success: false,
                message: 'You have already replied to the latest admin response'
            });
        }

        const now = new Date();
        const replyLine = `[Student Reply|responseKey=${responseKey}|sentAt=${now.toISOString()}]: ${trimmedMessage}`;
        const updatedDescription = complaint.Description
            ? `${complaint.Description}\n\n${replyLine}`
            : replyLine;

        await complaint.update({
            Description: updatedDescription,
            Status: 'in_progress'
        });

        await Activity.create({
            UserID: userId,
            ActivityType: 'complaint_filed',
            Description: `Sent a reply for complaint: ${complaint.Title}`,
            Icon: '💬',
            IconBackgroundColor: '#E3F2FD'
        });

        const updatedComplaint = await Complaint.findOne({
            where: { ComplaintID: complaint.ComplaintID },
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number', 'Contact_Number', 'Email']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ]
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('complaint:updated', updatedComplaint);
        }

        return res.status(200).json({
            success: true,
            message: 'Reply sent successfully',
            data: updatedComplaint
        });
    } catch (error) {
        console.error('Reply Complaint Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send complaint reply',
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

// Get Admin Dashboard Statistics
export const getAdminDashboard = async (req, res) => {
    try {
        // Get total students count
        const totalStudents = await User.count();

        // Get total rooms count
        const totalRooms = await Room.count();

        // Get occupied rooms count (rooms with current occupancy > 0)
        const occupiedRooms = await Room.count({
            where: {
                CurrentOccupancy: {
                    [Op.gt]: 0
                }
            }
        });

        // Get pending complaints count
        const pendingComplaints = await Complaint.count({
            where: {
                Status: {
                    [Op.in]: ['pending', 'open']
                }
            }
        });

        // Get recent check-ins (last 5)
        const recentCheckIns = await Booking.findAll({
            where: {
                Status: 'checked_in'
            },
            include: [{
                model: User,
                attributes: ['UID', 'Registration_Number', 'Username', 'Contact_Number']
            }, {
                model: Room,
                attributes: ['RoomID', 'RoomNumber']
            }],
            order: [['CheckInDate', 'DESC']],
            limit: 5
        });

        // Format response
        const dashboardStats = {
            stats: {
                totalStudents,
                totalRooms,
                occupiedRooms,
                pendingComplaints
            },
            recentCheckIns: recentCheckIns.map(booking => ({
                studentId: booking.User.Registration_Number,
                name: booking.User.Username,
                room: booking.Room.RoomNumber,
                checkInTime: booking.CheckInDate,
                duration: calculateStayDuration(booking.CheckInDate, booking.CheckOutDate)
            }))
        };

        return res.status(200).json({
            success: true,
            data: dashboardStats
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch admin dashboard data',
            error: error.message
        });
    }
};

// Helper function to calculate stay duration
const calculateStayDuration = (checkInDate, checkOutDate) => {
    if (!checkInDate) return '0 Days';
    
    const checkIn = new Date(checkInDate);
    const checkOut = checkOutDate ? new Date(checkOutDate) : new Date();
    const diffTime = checkOut - checkIn;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffTime / (1000 * 60));
            return `${diffMins} mins`;
        }
        return `${diffHours} hours`;
    }
    
    return `${diffDays} Days`;
};

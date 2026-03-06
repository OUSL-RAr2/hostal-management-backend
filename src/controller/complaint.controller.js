import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";
import Room from "../models/room.model.js";
import { Op } from "sequelize";

// Get all complaints
export const getAllComplaints = async (req, res, next) => {
    try {
        const { status, priority, category } = req.query;

        let whereCondition = {};

        // Apply filters if provided
        if (status) {
            whereCondition.Status = status;
        }
        if (priority) {
            whereCondition.Priority = priority;
        }
        if (category) {
            whereCondition.Category = category;
        }

        const complaints = await Complaint.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number', 'Contact_Number', 'Email']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            message: "Complaints fetched successfully",
            data: complaints
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch complaints",
            error: error.message
        });
    }
};

// Get complaint by ID
export const getComplaintById = async (req, res, next) => {
    try {
        const { complaintId } = req.params;

        const complaint = await Complaint.findOne({
            where: { ComplaintID: complaintId },
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

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        return res.status(200).json({
            message: "Complaint fetched successfully",
            data: complaint
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch complaint",
            error: error.message
        });
    }
};

// Get complaints by user ID
export const getComplaintsByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const complaints = await Complaint.findAll({
            where: { UserID: userId },
            include: [
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            message: "User complaints fetched successfully",
            data: complaints
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user complaints",
            error: error.message
        });
    }
};

// Create new complaint
export const createComplaint = async (req, res, next) => {
    try {
        const { userId, roomId, category, title, description, priority } = req.body;

        // Validate required fields
        if (!userId || !category || !title || !description) {
            return res.status(400).json({
                message: "Missing required fields: userId, category, title, description"
            });
        }

        // Verify user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Verify room exists if provided
        if (roomId) {
            const room = await Room.findByPk(roomId);
            if (!room) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }
        }

        const newComplaint = await Complaint.create({
            UserID: userId,
            RoomID: roomId || null,
            Category: category,
            Title: title,
            Description: description,
            Priority: priority || 'medium',
            Status: 'pending'
        });

        // Fetch the created complaint with associations
        const complaintWithDetails = await Complaint.findOne({
            where: { ComplaintID: newComplaint.ComplaintID },
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ]
        });

        // Emit real-time event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('complaint:created', complaintWithDetails);
        }

        return res.status(201).json({
            message: "Complaint created successfully",
            data: complaintWithDetails
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create complaint",
            error: error.message
        });
    }
};

// Update complaint status
export const updateComplaintStatus = async (req, res, next) => {
    try {
        const { complaintId } = req.params;
        const { status, adminResponse } = req.body;

        const complaint = await Complaint.findByPk(complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        // Validate status
        const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value"
            });
        }

        const updateData = {};
        if (status) updateData.Status = status;
        if (adminResponse) updateData.AdminResponse = adminResponse;
        
        // Set ResolvedAt timestamp if status is resolved
        if (status === 'resolved') {
            updateData.ResolvedAt = new Date();
        }

        await complaint.update(updateData);

        // Fetch updated complaint with associations
        const updatedComplaint = await Complaint.findOne({
            where: { ComplaintID: complaintId },
            include: [
                {
                    model: User,
                    attributes: ['UID', 'Username', 'Registration_Number']
                },
                {
                    model: Room,
                    attributes: ['RoomID', 'RoomNumber', 'FloorNumber']
                }
            ]
        });

        // Emit real-time event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('complaint:updated', updatedComplaint);
        }

        return res.status(200).json({
            message: "Complaint updated successfully",
            data: updatedComplaint
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update complaint",
            error: error.message
        });
    }
};

// Update complaint priority
export const updateComplaintPriority = async (req, res, next) => {
    try {
        const { complaintId } = req.params;
        const { priority } = req.body;

        const complaint = await Complaint.findByPk(complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority value"
            });
        }

        await complaint.update({ Priority: priority });

        return res.status(200).json({
            message: "Complaint priority updated successfully",
            data: complaint
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update complaint priority",
            error: error.message
        });
    }
};

// Delete complaint
export const deleteComplaint = async (req, res, next) => {
    try {
        const { complaintId } = req.params;

        const complaint = await Complaint.findByPk(complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        await complaint.destroy();

        return res.status(200).json({
            message: "Complaint deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete complaint",
            error: error.message
        });
    }
};

// Get complaint statistics
export const getComplaintStats = async (req, res, next) => {
    try {
        const totalComplaints = await Complaint.count();
        const pendingComplaints = await Complaint.count({ where: { Status: 'pending' } });
        const inProgressComplaints = await Complaint.count({ where: { Status: 'in_progress' } });
        const resolvedComplaints = await Complaint.count({ where: { Status: 'resolved' } });
        const rejectedComplaints = await Complaint.count({ where: { Status: 'rejected' } });

        const stats = {
            total: totalComplaints,
            pending: pendingComplaints,
            inProgress: inProgressComplaints,
            resolved: resolvedComplaints,
            rejected: rejectedComplaints
        };

        return res.status(200).json({
            message: "Complaint statistics fetched successfully",
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch complaint statistics",
            error: error.message
        });
    }
};

import QRCode from '../models/qrCode.model.js';
import CheckInOut from '../models/checkInOut.model.js';
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import { v4 as uuidv4 } from 'uuid';
import qrcode from 'qrcode';
import { Op } from 'sequelize';

/**
 * Generate a new QR code for a specific device/location
 */
export const generateQRCode = async (req, res) => {
    try {
        const { deviceId, location } = req.body;

        if (!deviceId || !location) {
            return res.status(400).json({
                success: false,
                message: 'Device ID and location are required'
            });
        }

        // Deactivate any existing active QR codes for this device
        await QRCode.update(
            { IsActive: false },
            { 
                where: { 
                    DeviceID: deviceId,
                    IsActive: true 
                } 
            }
        );

        // Generate a unique code
        const uniqueCode = uuidv4();
        
        // Set expiration time (e.g., 5 minutes from now, or can be configurable)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Create QR code record
        const qrCodeRecord = await QRCode.create({
            Code: uniqueCode,
            DeviceID: deviceId,
            Location: location,
            IsActive: true,
            ExpiresAt: expiresAt,
            CreatedBy: req.user?.Username || 'system'
        });

        // Generate QR code image as data URL
        const qrCodeDataURL = await qrcode.toDataURL(uniqueCode, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2
        });

        return res.status(201).json({
            success: true,
            data: {
                qrCodeId: qrCodeRecord.QRCodeID,
                code: uniqueCode,
                deviceId: qrCodeRecord.DeviceID,
                location: qrCodeRecord.Location,
                expiresAt: qrCodeRecord.ExpiresAt,
                qrCodeImage: qrCodeDataURL
            }
        });

    } catch (error) {
        console.error('Generate QR Code Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
};

/**
 * Get active QR code for a specific device
 */
export const getActiveQRCode = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Find active QR code for this device that hasn't expired
        const qrCodeRecord = await QRCode.findOne({
            where: {
                DeviceID: deviceId,
                IsActive: true,
                ExpiresAt: {
                    [Op.gt]: new Date()
                }
            },
            order: [['createdAt', 'DESC']]
        });

        if (!qrCodeRecord) {
            return res.status(404).json({
                success: false,
                message: 'No active QR code found for this device'
            });
        }

        // Generate QR code image
        const qrCodeDataURL = await qrcode.toDataURL(qrCodeRecord.Code, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2
        });

        return res.status(200).json({
            success: true,
            data: {
                qrCodeId: qrCodeRecord.QRCodeID,
                code: qrCodeRecord.Code,
                deviceId: qrCodeRecord.DeviceID,
                location: qrCodeRecord.Location,
                expiresAt: qrCodeRecord.ExpiresAt,
                qrCodeImage: qrCodeDataURL,
                usedCount: qrCodeRecord.UsedCount
            }
        });

    } catch (error) {
        console.error('Get QR Code Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch QR code',
            error: error.message
        });
    }
};

/**
 * Process QR code scan for check-in/check-out
 */
export const processQRScan = async (req, res) => {
    try {
        const userId = req.user.UID;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'QR code is required'
            });
        }

        // Find the QR code
        const qrCodeRecord = await QRCode.findOne({
            where: {
                Code: code,
                IsActive: true
            }
        });

        if (!qrCodeRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired QR code'
            });
        }

        // Check if QR code has expired
        if (new Date() > new Date(qrCodeRecord.ExpiresAt)) {
            await qrCodeRecord.update({ IsActive: false });
            return res.status(400).json({
                success: false,
                message: 'QR code has expired'
            });
        }

        // Get the last check-in/out action for this user
        const lastLog = await CheckInOut.findOne({
            where: { UserID: userId },
            order: [['Timestamp', 'DESC']]
        });

        // Determine the action (toggle between check_in and check_out)
        const action = (!lastLog || lastLog.Action === 'check_out') ? 'check_in' : 'check_out';

        // Create check-in/out log
        const checkInOutLog = await CheckInOut.create({
            UserID: userId,
            Action: action,
            Location: qrCodeRecord.Location,
            QRCodeID: qrCodeRecord.QRCodeID,
            DeviceID: qrCodeRecord.DeviceID,
            Timestamp: new Date()
        });

        // Update QR code usage
        await qrCodeRecord.update({
            UsedCount: qrCodeRecord.UsedCount + 1,
            LastUsedAt: new Date(),
            IsActive: false // Deactivate after use (requires refresh)
        });

        // Create activity log
        const activityIcon = action === 'check_in' ? '✓' : '✗';
        const activityColor = action === 'check_in' ? '#E8F5E9' : '#FFEBEE';
        const activityDescription = action === 'check_in' 
            ? `Checked in at ${qrCodeRecord.Location}`
            : `Checked out from ${qrCodeRecord.Location}`;

        await Activity.create({
            UserID: userId,
            ActivityType: action,
            Description: activityDescription,
            Icon: activityIcon,
            IconBackgroundColor: activityColor
        });

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['Username', 'Email', 'NIC']
        });

        return res.status(200).json({
            success: true,
            message: `Successfully ${action === 'check_in' ? 'checked in' : 'checked out'}`,
            data: {
                logId: checkInOutLog.LogID,
                action: action,
                timestamp: checkInOutLog.Timestamp,
                location: qrCodeRecord.Location,
                user: {
                    username: user.Username,
                    email: user.Email
                }
            }
        });

    } catch (error) {
        console.error('Process QR Scan Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process QR code scan',
            error: error.message
        });
    }
};

/**
 * Get check-in/out logs for a user
 */
export const getUserCheckInOutLogs = async (req, res) => {
    try {
        const userId = req.user.UID;
        const { startDate, endDate, limit = 50 } = req.query;

        const whereClause = { UserID: userId };

        // Add date filters if provided
        if (startDate || endDate) {
            whereClause.Timestamp = {};
            if (startDate) {
                whereClause.Timestamp[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.Timestamp[Op.lte] = new Date(endDate);
            }
        }

        const logs = await CheckInOut.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['Username', 'Email']
            }],
            order: [['Timestamp', 'DESC']],
            limit: parseInt(limit)
        });

        return res.status(200).json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Get Check-In/Out Logs Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch check-in/out logs',
            error: error.message
        });
    }
};

/**
 * Get current status of all students (for admin dashboard)
 */
export const getAllStudentsStatus = async (req, res) => {
    try {
        // Get all users
        const users = await User.findAll({
            where: { Role: 'student' },
            attributes: ['UID', 'Username', 'Email', 'NIC', 'Registration_Number']
        });

        const userStatuses = await Promise.all(users.map(async (user) => {
            // Get last check-in/out log
            const lastLog = await CheckInOut.findOne({
                where: { UserID: user.UID },
                order: [['Timestamp', 'DESC']]
            });

            return {
                userId: user.UID,
                username: user.Username,
                email: user.Email,
                nic: user.NIC,
                registrationNumber: user.Registration_Number,
                currentStatus: lastLog?.Action === 'check_in' ? 'inside' : 'outside',
                lastAction: lastLog?.Action || 'unknown',
                lastLocation: lastLog?.Location || null,
                lastTimestamp: lastLog?.Timestamp || null
            };
        }));

        // Count students inside and outside
        const insideCount = userStatuses.filter(u => u.currentStatus === 'inside').length;
        const outsideCount = userStatuses.filter(u => u.currentStatus === 'outside').length;

        return res.status(200).json({
            success: true,
            data: {
                students: userStatuses,
                summary: {
                    total: userStatuses.length,
                    inside: insideCount,
                    outside: outsideCount
                }
            }
        });

    } catch (error) {
        console.error('Get All Students Status Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch students status',
            error: error.message
        });
    }
};

/**
 * Get check-in/out statistics
 */
export const getCheckInOutStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {};
        
        if (startDate || endDate) {
            whereClause.Timestamp = {};
            if (startDate) {
                whereClause.Timestamp[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.Timestamp[Op.lte] = new Date(endDate);
            }
        }

        const logs = await CheckInOut.findAll({
            where: whereClause,
            attributes: ['Action', 'Location', 'Timestamp']
        });

        const checkInCount = logs.filter(log => log.Action === 'check_in').length;
        const checkOutCount = logs.filter(log => log.Action === 'check_out').length;

        // Group by location
        const locationStats = logs.reduce((acc, log) => {
            if (!acc[log.Location]) {
                acc[log.Location] = { check_in: 0, check_out: 0 };
            }
            acc[log.Location][log.Action]++;
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            data: {
                total: logs.length,
                checkIns: checkInCount,
                checkOuts: checkOutCount,
                byLocation: locationStats
            }
        });

    } catch (error) {
        console.error('Get Statistics Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

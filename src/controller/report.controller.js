import User from '../models/user.model.js';
import { Op } from 'sequelize';

// Get new students registered today
export const getDailyReport = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newStudents = await User.findAll({
            where: {
                createdAt: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                },
                Role: 'user'
            },
            attributes: ['UID', 'Username', 'Registration_Number', 'NIC', 'Faculty', 'Center', 'Contact_Number', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            period: 'Daily',
            date: today.toISOString().split('T')[0],
            totalCount: newStudents.length,
            students: newStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching daily report',
            error: error.message
        });
    }
};

// Get new students registered this week
export const getWeeklyReport = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const newStudents = await User.findAll({
            where: {
                createdAt: {
                    [Op.gte]: weekAgo,
                    [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                },
                Role: 'user'
            },
            attributes: ['UID', 'Username', 'Registration_Number', 'NIC', 'Faculty', 'Center', 'Contact_Number', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            period: 'Weekly',
            startDate: weekAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            totalCount: newStudents.length,
            students: newStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching weekly report',
            error: error.message
        });
    }
};

// Get new students registered this month
export const getMonthlyReport = async (req, res) => {
    try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const newStudents = await User.findAll({
            where: {
                createdAt: {
                    [Op.gte]: firstDayOfMonth,
                    [Op.lte]: lastDayOfMonth
                },
                Role: 'user'
            },
            attributes: ['UID', 'Username', 'Registration_Number', 'NIC', 'Faculty', 'Center', 'Contact_Number', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            period: 'Monthly',
            month: firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
            startDate: firstDayOfMonth.toISOString().split('T')[0],
            endDate: lastDayOfMonth.toISOString().split('T')[0],
            totalCount: newStudents.length,
            students: newStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly report',
            error: error.message
        });
    }
};

// Get custom date range report
export const getCustomReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both startDate and endDate in YYYY-MM-DD format'
            });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const newStudents = await User.findAll({
            where: {
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                },
                Role: 'user'
            },
            attributes: ['UID', 'Username', 'Registration_Number', 'NIC', 'Faculty', 'Center', 'Contact_Number', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            period: 'Custom',
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            totalCount: newStudents.length,
            students: newStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching custom report',
            error: error.message
        });
    }
};

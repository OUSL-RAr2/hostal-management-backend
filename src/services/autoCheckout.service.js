import { Op, fn, col, where as sequelizeWhere } from 'sequelize';
import sequelize from '../config/db.js';
import Booking from '../models/booking.model.js';
import Room from '../models/room.model.js';

const getRoomStatusFromOccupancy = (room, occupancy) => {
    if (room.Status === 'maintenance') {
        return 'maintenance';
    }

    return occupancy >= room.Capacity ? 'occupied' : 'available';
};

export const checkoutBookingById = async (bookingId) => {
    return sequelize.transaction(async (transaction) => {
        const booking = await Booking.findByPk(bookingId, {
            include: [Room],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!booking) {
            return { success: false, reason: 'not_found' };
        }

        if (booking.Status === 'checked_out') {
            return { success: false, reason: 'already_checked_out' };
        }

        await booking.update(
            { Status: 'checked_out' },
            { transaction }
        );

        const room = await Room.findByPk(booking.RoomID, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (room) {
            const updatedOccupancy = Math.max(0, room.CurrentOccupancy - 1);
            await room.update(
                {
                    CurrentOccupancy: updatedOccupancy,
                    Status: getRoomStatusFromOccupancy(room, updatedOccupancy)
                },
                { transaction }
            );
        }

        return { success: true, bookingId: booking.BookingID };
    });
};

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const autoCheckoutExpiredBookings = async () => {
    const todayLocal = getLocalDateString();

    const expiredBookings = await Booking.findAll({
        where: {
            Status: 'checked_in',
            [Op.and]: [sequelizeWhere(fn('DATE', col('CheckOutDate')), Op.lt, todayLocal)]
        },
        attributes: ['BookingID']
    });

    let checkedOutCount = 0;

    for (const booking of expiredBookings) {
        const result = await checkoutBookingById(booking.BookingID);
        if (result.success) {
            checkedOutCount += 1;
        }
    }

    return {
        scannedCount: expiredBookings.length,
        checkedOutCount
    };
};

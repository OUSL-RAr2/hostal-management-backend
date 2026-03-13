import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";
import Room from "./room.model.js";

const Booking = sequelize.define('Booking', {
    BookingID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    UserID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'UID'
        }
    },
    RoomID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Room,
            key: 'RoomID'
        }
    },
    CheckInDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    CheckOutDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    Status: {
        type: DataTypes.ENUM,
        values: ['pending', 'checked_in', 'checked_out', 'cancelled'],
        defaultValue: 'pending'
    },
    BookingDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {timestamps: true, tableName: 'Bookings'});

// Define associations
Booking.belongsTo(User, { foreignKey: 'UserID' });
Booking.belongsTo(Room, { foreignKey: 'RoomID' });

export default Booking;

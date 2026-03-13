import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Room = sequelize.define('Room', {
    RoomID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    RoomNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    FloorNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4
    },
    CurrentOccupancy: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    Status: {
        type: DataTypes.ENUM,
        values: ['available', 'occupied', 'maintenance'],
        defaultValue: 'available'
    },
    Gender: {
        type: DataTypes.ENUM,
        values: ['male', 'female'],
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'Rooms',
    indexes: [{
        unique: true,
        fields: ['RoomNumber', 'FloorNumber']
    }]
});

export default Room;

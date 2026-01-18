import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";
import Room from "./room.model.js";

const Complaint = sequelize.define('Complaint', {
    ComplaintID: {
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
        allowNull: true,
        references: {
            model: Room,
            key: 'RoomID'
        }
    },
    Category: {
        type: DataTypes.ENUM,
        values: ['maintenance', 'cleanliness', 'noise', 'security', 'facilities', 'other'],
        allowNull: false
    },
    Title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Status: {
        type: DataTypes.ENUM,
        values: ['pending', 'in_progress', 'resolved', 'rejected'],
        defaultValue: 'pending'
    },
    Priority: {
        type: DataTypes.ENUM,
        values: ['low', 'medium', 'high', 'urgent'],
        defaultValue: 'medium'
    },
    AdminResponse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ResolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {timestamps: true, tableName: 'Complaints'});

// Define associations
Complaint.belongsTo(User, { foreignKey: 'UserID' });
Complaint.belongsTo(Room, { foreignKey: 'RoomID' });

export default Complaint;

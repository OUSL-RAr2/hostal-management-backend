import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";

const Activity = sequelize.define('Activity', {
    ActivityID: {
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
    ActivityType: {
        type: DataTypes.ENUM,
        values: ['check_in', 'check_out', 'room_assignment', 'complaint_filed', 'profile_update'],
        allowNull: false
    },
    Description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Icon: {
        type: DataTypes.STRING,
        defaultValue: '📋'
    },
    IconBackgroundColor: {
        type: DataTypes.STRING,
        defaultValue: '#E3F2FD'
    },
    Timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {timestamps: true, tableName: 'Activities'});

// Define associations
Activity.belongsTo(User, { foreignKey: 'UserID' });

export default Activity;

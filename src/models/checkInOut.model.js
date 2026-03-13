import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";

const CheckInOut = sequelize.define('CheckInOut', {
    LogID: {
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
    Action: {
        type: DataTypes.ENUM,
        values: ['check_in', 'check_out'],
        allowNull: false
    },
    Timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    Location: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Hostel location (e.g., Boys Hostel, Girls Hostel)'
    },
    QRCodeID: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Reference to the QR code used for this check-in/out'
    },
    DeviceID: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device identifier for tracking which terminal was used'
    }
}, { 
    timestamps: true, 
    tableName: 'CheckInOutLogs',
    indexes: [
        {
            fields: ['UserID', 'Timestamp']
        },
        {
            fields: ['Timestamp']
        }
    ]
});

// Define associations
CheckInOut.belongsTo(User, { foreignKey: 'UserID' });

export default CheckInOut;

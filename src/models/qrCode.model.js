import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const QRCode = sequelize.define('QRCode', {
    QRCodeID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    Code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique code embedded in QR'
    },
    DeviceID: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Device identifier (e.g., boys-hostel, girls-hostel)'
    },
    Location: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Physical location (e.g., Boys Hostel, Girls Hostel)'
    },
    IsActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    UsedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    ExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When this QR code expires'
    },
    LastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    CreatedBy: {
        type: DataTypes.STRING,
        defaultValue: 'system',
        allowNull: false
    }
}, { 
    timestamps: true, 
    tableName: 'QRCodes',
    indexes: [
        {
            unique: true,
            fields: ['Code']
        },
        {
            fields: ['DeviceID', 'IsActive']
        }
    ]
});

export default QRCode;

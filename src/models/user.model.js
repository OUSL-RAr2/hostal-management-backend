import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define('User', {
    UID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    Student_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Registration_Number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    Center: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Distance_from_home: {
        type: DataTypes.INTEGER,
        allowNull: false,
        min: 50
    },
    Faculty: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Contact_Number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Emergency_Contact: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Role: {
        type: DataTypes.ENUM,
        values: ['user', 'admin'],
        defaultValue: 'user'
    }
}, {timestamps: true, tableName: 'Users'})

export default User;


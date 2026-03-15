import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Admin = sequelize.define('Admin', {
  AdminID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    columnName: 'AdminID',
  },
  NIC: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    columnName: 'NIC',
    comment: 'National Identity Card number',
  },
  Name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    columnName: 'Name',
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    columnName: 'Email',
    validate: {
      isEmail: true,
    },
  },
  ContactNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    columnName: 'ContactNumber',
  },
  Password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    columnName: 'Password',
  },
  Role: {
    type: DataTypes.ENUM('admin', 'super_admin'),
    allowNull: false,
    defaultValue: 'admin',
    columnName: 'Role',
  },
}, {
  tableName: 'Admins',
  timestamps: true,
});

export default Admin;

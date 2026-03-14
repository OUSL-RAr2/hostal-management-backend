import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import Admin from '../models/admin.model.js';
import jwtAuth from '../utils/jwt.util.js';

export const adminSignUp = async (req, res) => {
  try {
    const { nic, name, email, contactNumber, password, confirmPassword } = req.body;

    // Validation
    if (!nic || !name || !email || !contactNumber || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [{ NIC: nic }, { Email: email }],
      },
    });

    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this NIC or Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await Admin.create({
      NIC: nic,
      Name: name,
      Email: email,
      ContactNumber: contactNumber,
      Password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: { 
        AdminID: admin.AdminID, 
        Name: admin.Name, 
        Email: admin.Email,
        ContactNumber: admin.ContactNumber,
        NIC: admin.NIC,
      },
    });
  } catch (error) {
    console.error('Error in adminSignUp:', error);
    return res.status(500).json({ success: false, message: 'Error creating admin account', error: error.message });
  }
};

export const adminSignIn = async (req, res) => {
  try {
    const { nic, password } = req.body;

    // Validation
    if (!nic || !password) {
      return res.status(400).json({ success: false, message: 'NIC and password are required' });
    }

    // Find admin by NIC
    const admin = await Admin.findOne({ where: { NIC: nic } });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid NIC or password' });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, admin.Password);

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid NIC or password' });
    }

    // Generate JWT token
    const token = jwtAuth.sign({ AdminID: admin.AdminID, role: 'admin' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: { 
          AdminID: admin.AdminID, 
          Name: admin.Name, 
          Email: admin.Email,
          ContactNumber: admin.ContactNumber,
          NIC: admin.NIC,
        },
      },
    });
  } catch (error) {
    console.error('Error in adminSignIn:', error);
    return res.status(500).json({ success: false, message: 'Error during login', error: error.message });
  }
};

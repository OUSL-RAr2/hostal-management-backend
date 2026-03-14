import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import Admin from '../models/admin.model.js';
import jwtAuth from '../utils/jwt.util.js';

const formatAdmin = (admin) => ({
  AdminID: admin.AdminID,
  Name: admin.Name,
  Email: admin.Email,
  ContactNumber: admin.ContactNumber,
  NIC: admin.NIC,
  Role: admin.Role,
});

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
      Role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: formatAdmin(admin),
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
    const token = jwtAuth.sign({ AdminID: admin.AdminID, role: admin.Role || 'admin' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: formatAdmin(admin),
      },
    });
  } catch (error) {
    console.error('Error in adminSignIn:', error);
    return res.status(500).json({ success: false, message: 'Error during login', error: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = req.admin;

    return res.status(200).json({
      success: true,
      message: 'Admin profile fetched successfully',
      data: formatAdmin(admin),
    });
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    return res.status(500).json({ success: false, message: 'Error fetching admin profile', error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const admin = req.admin;
    const { name, email, contactNumber } = req.body;

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }

    if (email !== undefined && !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email cannot be empty' });
    }

    if (contactNumber !== undefined && !String(contactNumber).trim()) {
      return res.status(400).json({ success: false, message: 'Contact number cannot be empty' });
    }

    if (email !== undefined && email !== admin.Email) {
      const existingEmail = await Admin.findOne({ where: { Email: email } });
      if (existingEmail && existingEmail.AdminID !== admin.AdminID) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      admin.Email = email;
    }

    if (name !== undefined) admin.Name = name;
    if (contactNumber !== undefined) admin.ContactNumber = contactNumber;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatAdmin(admin),
    });
  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    return res.status(500).json({ success: false, message: 'Error updating admin profile', error: error.message });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const admin = req.admin;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.Password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.Password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in changeAdminPassword:', error);
    return res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ['AdminID', 'NIC', 'Name', 'Email', 'ContactNumber', 'Role', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Admins fetched successfully',
      data: admins,
    });
  } catch (error) {
    console.error('Error in getAdmins:', error);
    return res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
  }
};

export const createAdminBySuperAdmin = async (req, res) => {
  try {
    const { nic, name, email, contactNumber, password, confirmPassword } = req.body;

    if (!nic || !name || !email || !contactNumber || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [{ NIC: nic }, { Email: email }],
      },
    });

    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this NIC or Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      NIC: nic,
      Name: name,
      Email: email,
      ContactNumber: contactNumber,
      Password: hashedPassword,
      Role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: formatAdmin(admin),
    });
  } catch (error) {
    console.error('Error in createAdminBySuperAdmin:', error);
    return res.status(500).json({ success: false, message: 'Error creating admin account', error: error.message });
  }
};

export const deleteAdminBySuperAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    if (req.admin.AdminID === adminId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const targetAdmin = await Admin.findByPk(adminId);

    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (targetAdmin.Role === 'super_admin') {
      return res.status(400).json({ success: false, message: 'Super admin account cannot be deleted' });
    }

    await targetAdmin.destroy();

    return res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteAdminBySuperAdmin:', error);
    return res.status(500).json({ success: false, message: 'Error deleting admin account', error: error.message });
  }
};

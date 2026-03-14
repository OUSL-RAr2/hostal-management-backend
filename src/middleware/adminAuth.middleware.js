import jwtAuth from '../utils/jwt.util.js';
import Admin from '../models/admin.model.js';

export const authorizeAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decoded = jwtAuth.verify(token);

    if (!decoded?.AdminID) {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }

    const admin = await Admin.findByPk(decoded.AdminID);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized', error: error.message });
  }
};

export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.admin.Role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only super admin can perform this action' });
  }

  next();
};

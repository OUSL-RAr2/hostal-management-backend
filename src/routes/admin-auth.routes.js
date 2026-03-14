import express from 'express';
import {
	adminSignIn,
	getAdminProfile,
	updateAdminProfile,
	changeAdminPassword,
	getAdmins,
	createAdminBySuperAdmin,
	deleteAdminBySuperAdmin,
} from '../controller/admin-auth.controller.js';
import { authorizeAdmin, authorizeSuperAdmin } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.post('/sign-in', adminSignIn);
router.get('/profile', authorizeAdmin, getAdminProfile);
router.put('/profile', authorizeAdmin, updateAdminProfile);
router.put('/change-password', authorizeAdmin, changeAdminPassword);
router.get('/admins', authorizeAdmin, authorizeSuperAdmin, getAdmins);
router.post('/admins', authorizeAdmin, authorizeSuperAdmin, createAdminBySuperAdmin);
router.delete('/admins/:adminId', authorizeAdmin, authorizeSuperAdmin, deleteAdminBySuperAdmin);

export default router;

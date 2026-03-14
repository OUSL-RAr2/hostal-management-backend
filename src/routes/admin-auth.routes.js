import express from 'express';
import { adminSignUp, adminSignIn } from '../controller/admin-auth.controller.js';

const router = express.Router();

router.post('/sign-up', adminSignUp);
router.post('/sign-in', adminSignIn);

export default router;

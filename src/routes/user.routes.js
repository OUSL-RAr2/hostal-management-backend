import { Router } from 'express';

import { authorize } from '../middleware/auth.middleware.js'
import { getUsers, getUserById, updateUser, getUserByIdForPanel, updateUserForPanel } from '../controller/user.controller.js'
import checkAdmin from '../middleware/checkAdmin.middleware.js';


const userRoutes = Router();

// Web panel routes (no token flow in current web app)
userRoutes.get('/panel/:id', getUserByIdForPanel);
userRoutes.put('/panel/:id', updateUserForPanel);

userRoutes.get('/all', authorize, checkAdmin, getUsers);
userRoutes.get('/:id', authorize, getUserById);
userRoutes.put('/:id', authorize, updateUser);

export default userRoutes;
import { Router } from 'express';

import { authorize } from '../middleware/auth.middleware.js'
import { getUsers, getUserById, updateUser } from '../controller/user.controller.js'
import checkAdmin from '../middleware/checkAdmin.middleware.js';


const userRoutes = Router();

userRoutes.get('/all', (authorize, checkAdmin), getUsers);
userRoutes.get('/:id', authorize, getUserById);
userRoutes.put('/:id', (authorize, checkAdmin), updateUser);

export default userRoutes;
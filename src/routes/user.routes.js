import { Router } from 'express';

import { authorize } from '../middleware/auth.middleware.js'
import { getUsers } from '../controller/user.controller.js'
import checkAdmin from '../middleware/checkAdmin.middleware.js';


const userRoutes = Router();

userRoutes.get('/all', (authorize, checkAdmin), getUsers);

export default userRoutes;
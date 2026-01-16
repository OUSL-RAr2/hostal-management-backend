import { Router } from 'express';
import { signIn, signUp } from '../controller/auth.controller.js'

const authRoutes = Router()

authRoutes.post('/sign-up', signUp)

authRoutes.post('/sign-in', signIn)

authRoutes.post('/sign-out', (req, res)=>{
    res.send("sign out here")
})

export default authRoutes;
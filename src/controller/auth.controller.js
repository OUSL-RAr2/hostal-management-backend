import User from '../models/user.model.js'
import jwtAuth from '../utils/jwt.util.js'
import bcrypt from 'bcryptjs'
import { cookies } from '../utils/cookies.util.js'


export const signUp = async(req, res, next)=>{
    try {

        const {username, email, password, role} = req.body;

        const existingUser = await User.findOne({where: {Email: email}});

        // check for existing users
        if (existingUser){
            return res.status(409).send("User already exist")
        }

        // password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            Username: username,
            Email: email,
            Password: hashedPassword,
            Role: role
        })

        return res.status(200).json({
            message: "Account created successfully",
            data: newUser
        })

    } catch (error) {
        res.status(401).json({
            message: "Authentication Error",
            error: error.message
        })
    }
}

export const signIn = async(req, res, next)=>{
    try {
        const {email, password} = req.body;

        //fetch user from database
        const user = await User.findOne({where: {Email: email}});

        if (!user){
            return res.status(404).send("User not found");
        }

        //compare password
        const validatePassword = await bcrypt.compare(password, user.Password);

        if (!validatePassword){
            return res.status(401).send("Incorrect password");
        }


        const token = jwtAuth.sign({uid: user.UID});

        cookies.setCookie('AUTH_TOKEN', token, res)


        return res.status(200).json({
            message: "Signed in successfully",
            data: user
        })

        
    } catch (error) {
       res.status(401).json({
        message: "Authentication error",
        error: error.message
       })
    }

}
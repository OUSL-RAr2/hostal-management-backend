import User from '../models/user.model.js'
import jwtAuth from '../utils/jwt.util.js'
import bcrypt from 'bcryptjs'

export const signUp = async(req, res, next)=>{
    try {

        const {student_id, username, registration_number, 
            center, distance_from_home, faculty, contact_number, 
            emergency_contact, email, password, role} = req.body;

        const existingUser = await User.findOne({where: {Student_ID: student_id}});

        // check for existing users
        if (existingUser){
            return res.status(409).send("User already exist")
        }

        // password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            Student_ID: student_id,
            Username: username,
            Registration_Number: registration_number,
            Center: center,
            Distance_from_home: distance_from_home,
            Faculty: faculty,
            Contact_Number: contact_number,
            Emergency_Contact: emergency_contact,
            Email: email,
            Password: hashedPassword,
            Role: role
        })

        return res.status(201).json({
            message: "Account created successfully",
            data: {
                "Name": newUser.Username
            }
        })

    } catch (error) {
        res.status(500).json({
            message: "Authentication Error",
            error: error.message
        })
        console.log(error)
    }
}

export const signIn = async(req, res, next)=>{
    try {
        const {student_id, password} = req.body;

        //fetch user from database
        const user = await User.findOne({where: {Student_ID: student_id}});

        if (!user){
            return res.status(404).send("User not found");
        }

        //compare password
        const validatePassword = await bcrypt.compare(password, user.Password);

        if (!validatePassword){
            return res.status(401).send("Incorrect password");
        }


        const token = jwtAuth.sign({uid: user.UID});

        return res.status(200).json({
            message: "Signed in successfully",
            token,
            data: user
        })

        
    } catch (error) {
       res.status(401).json({
        message: "Authentication error",
        error: error.message
       })
    }

}
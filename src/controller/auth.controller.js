import User from '../models/user.model.js'
import Booking from '../models/booking.model.js'
import jwtAuth from '../utils/jwt.util.js'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'

export const signUp = async(req, res, next)=>{
    try {

        const {nic, username, registration_number, 
            center, distance_from_home, faculty, contact_number, 
            emergency_contact, email, password, role} = req.body;

        const existingUser = await User.findOne({where: {NIC: nic}});

        // check for existing users
        if (existingUser){
            // Check if user has any active bookings
            const activeBooking = await Booking.findOne({
                where: {
                    UserID: existingUser.UID,
                    Status: {
                        [Op.in]: ['pending', 'checked_in']
                    }
                }
            });

            if (activeBooking) {
                return res.status(409).json({
                    message: "User with this NIC already exists and has an active booking"
                });
            }

            // Check for duplicate registration number from other users
            const existingRegNumber = await User.findOne({
                where: {
                    Registration_Number: registration_number,
                    UID: { [Op.ne]: existingUser.UID } // Exclude current user
                }
            });
            if (existingRegNumber){
                return res.status(409).json({
                    message: "User with this registration number already exists"
                });
            }

            // User exists but no active bookings - update their info
            const hashedPassword = await bcrypt.hash(password, 10);

            await existingUser.update({
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
            });

            return res.status(200).json({
                message: "Account updated and reactivated successfully",
                data: {
                    "Name": existingUser.Username
                }
            });
        }

        // check for duplicate registration number (for new users only)
        const existingRegNumber = await User.findOne({where: {Registration_Number: registration_number}});
        if (existingRegNumber){
            return res.status(409).json({
                message: "User with this registration number already exists"
            })
        }

        // password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            NIC: nic,
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
        const {nic, password} = req.body;

        //fetch user from database
        const user = await User.findOne({where: {NIC: nic}});

        if (!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        //compare password
        const validatePassword = await bcrypt.compare(password, user.Password);

        if (!validatePassword){
            return res.status(401).json({
                message: "Incorrect password"
            });
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
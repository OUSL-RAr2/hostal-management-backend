import User from "../models/user.model.js";


export const getUsers = async(req, res, next)=>{
    try {
        const allUsers = await User.findAll();

        return res.status(200).json({
            message: "User data fetched successfully",
            data: allUsers
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const getUserById = async(req, res, next)=>{
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User data fetched successfully",
            data: user
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const updateUser = async(req, res, next)=>{
    try {
        const { id } = req.params;
        const { 
            username, 
            registration_number, 
            center, 
            distance_from_home, 
            faculty, 
            contact_number, 
            emergency_contact, 
            email 
        } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update user fields
        if (username !== undefined) user.Username = username;
        if (registration_number !== undefined) user.Registration_Number = registration_number;
        if (center !== undefined) user.Center = center;
        if (distance_from_home !== undefined) user.Distance_from_home = distance_from_home;
        if (faculty !== undefined) user.Faculty = faculty;
        if (contact_number !== undefined) user.Contact_number = contact_number;
        if (emergency_contact !== undefined) user.Emergency_Contact = emergency_contact;
        if (email !== undefined) user.Email = email;

        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            data: user
        })

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}
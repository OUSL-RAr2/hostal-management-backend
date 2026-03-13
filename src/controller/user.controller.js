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
        const requester = req.user;
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

        const isOwner = String(requester?.UID) === String(id);
        const isAdmin = requester?.Role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You can only update your own profile"
            });
        }

        if (!isAdmin) {
            const restrictedFields = [
                'username',
                'registration_number',
                'center',
                'distance_from_home',
                'faculty',
                'email'
            ];

            const hasRestrictedFieldUpdate = restrictedFields.some((field) => req.body?.[field] !== undefined);
            if (hasRestrictedFieldUpdate) {
                return res.status(403).json({
                    message: "Students can only update contact number and emergency contact"
                });
            }
        }

        // Update user fields
        if (isAdmin && username !== undefined) user.Username = username;
        if (isAdmin && registration_number !== undefined) user.Registration_Number = registration_number;
        if (isAdmin && center !== undefined) user.Center = center;
        if (isAdmin && distance_from_home !== undefined) user.Distance_from_home = distance_from_home;
        if (isAdmin && faculty !== undefined) user.Faculty = faculty;
        if (contact_number !== undefined) user.Contact_Number = contact_number;
        if (emergency_contact !== undefined) user.Emergency_Contact = emergency_contact;
        if (isAdmin && email !== undefined) user.Email = email;

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
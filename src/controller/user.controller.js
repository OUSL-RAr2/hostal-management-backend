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
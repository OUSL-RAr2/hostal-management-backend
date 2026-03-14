import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import jwtAuth from "../utils/jwt.util.js";


export const authorize = async(req, res, next)=>{

    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token){
            return res.status(401).json({message:"No token found"})
        }

        const decoded = jwtAuth.verify(token);

        const user = await User.findOne({where: {UID: decoded.uid}});

        if (!user){
            return res.status(404).send("Unauthorized")
        }

        // return res.status(200).json({
        //     data: user
        // })

        req.user = user

        next()

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message || 'Server error'
        });
    }

}

export const authMiddleware = async(req, res, next)=>{
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ success: false, message: "No token found" });
        }

        const decoded = jwtAuth.verify(token);

        // Check if it's an admin token
        if (decoded.role === 'admin') {
            const admin = await Admin.findByPk(decoded.AdminID);
            if (!admin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }
            req.user = admin;
            req.userType = 'admin';
        } else {
            // Fallback to regular user
            const user = await User.findOne({where: {UID: decoded.uid}});
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            req.user = user;
            req.userType = 'user';
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "Authentication error" });
    }
};

export default authorize;
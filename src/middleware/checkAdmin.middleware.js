import User from "../models/user.model.js";
import jwtAuth from "../utils/jwt.util.js";
import { Op } from "sequelize";

const checkAdmin = async(req, res, next)=>{

    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"});
        }

        const decoded = jwtAuth.verify(token);

        const isAdmin = await User.findOne({where: {[Op.and]:[ {UID: decoded.uid}, {Role: 'admin'}]}});

        // const user = req.user

        // const isAdmin = await User.findOne({where: {[Op.and]:[ {UID: user.UID}, {Role: 'admin'}]}});

        if (!isAdmin){
            res.status(401).send("Not an admin");
        }

        next();

   } catch (error) {
        res.status(500).json({
            message: "something went wrong",
            error: error.message
        })
    }

}

export default checkAdmin;
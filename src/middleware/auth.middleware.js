import User from "../models/user.model.js";
import jwtAuth from "../utils/jwt.util.js";
import { cookies } from "../utils/cookies.util.js";


export const authorize = async(req, res, next)=>{

    try {
        const token = cookies.getCookie('AUTH_TOKEN', req)

        if (!token){
            return res.status(401).send("Unauthorized")
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
        res.status(500).send("Something went wrong")
    }

}
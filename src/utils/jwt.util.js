import 'dotenv/config'
import jwt from 'jsonwebtoken'


const KEY = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d' // Default to 7 days if not set

const jwtAuth = {
    sign: (payload)=>{
        return jwt.sign(payload, KEY, {expiresIn: EXPIRES_IN})
    },

    verify: (token)=>{
        return jwt.verify(token, KEY)
    }
}

export default jwtAuth;
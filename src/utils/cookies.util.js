
export const cookies = {
    setCookie: (name, val, res)=>{
        res.cookie(name, val, {
            maxAge: 60000 * 60,
            httpOnly: true,
            secure: true
        });
    },
    getCookie: (name, req)=>{
        return req.cookies[name];
    },
    clearCookie: (name, res)=>{
        res.clearCookie(name);
    }
}




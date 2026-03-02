import aj from "../config/arcjet.config.js";


const arcjetMW = async(req, res, next)=>{
    try {
        const decision = await aj.protect(req, { requested: 1 }); // Deduct 5 tokens from the bucket
        console.log(decision);

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                res.status(403).json({error: "rate limited", message: "request denied"} );
            } else if (decision.reason.isBot()) {
                rres.status(403).json({error: "bot detected", message: "request denied"} );
            } else {
               res.status(403).json({error: "forbidden", message: "request denied"} );
            }
    // } else if (decision.ip.isHosting()) {
    //     // Requests from hosting IPs are likely from bots, so they can usually be
    //     // blocked. However, consider your use case - if this is an API endpoint
    //     // then hosting IPs might be legitimate.
    //     // https://docs.arcjet.com/blueprints/vpn-proxy-detection
    //     res.writeHead(403, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify({ error: "Forbidden" }));
    // } else if (decision.results.some(isSpoofedBot)) {
    //     // Paid Arcjet accounts include additional verification checks using IP data.
    //     // Verification isn't always possible, so we recommend checking the decision
    //     // separately.
    //     // https://docs.arcjet.com/bot-protection/reference#bot-verification
    //     res.writeHead(403, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify({ error: "Forbidden" }));
    // } else {
    //     res.writeHead(200, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify({ message: "Hello World" }));
    // }
        } 
        next();
    } catch (error) {
        res.status(500).json({
            message: "Arcjet middleware error",
            error: error.message
        })
    }
}

export default arcjetMW;
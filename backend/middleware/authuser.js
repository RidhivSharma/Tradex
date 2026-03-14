require("dotenv").config()
const jwt = require("jsonwebtoken")

function authuser(req, res, next) {
    const token = req.headers.token;

    if (token) {
        try {
            const resolvedToken = jwt.verify(token, process.env.JWT_USER_SECRET);
            req.user = resolvedToken;
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                res.status(401).json({ message: "Token expired, please login again" });
            } else {
                res.status(401).json({ message: "Wrong token, access denied" });
            }
        }
    } else {
        res.status(401).json({ message: "No token provided, please login" });
    }
}

module.exports = authuser;
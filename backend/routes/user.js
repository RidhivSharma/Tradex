require("dotenv").config()
const express=require("express")
const userrouter=express.Router();
const mongoose=require("mongoose");
const {google} =require("googleapis")
const bcrypt = require('bcrypt');
const { userModel } = require("../models/userdb");
const { alertmodel } = require("../models/alertsdb");
const jwt=require("jsonwebtoken");
const authuser = require("../middleware/authuser");

const saltRounds = parseInt(process.env.saltRounds)
const oauth2Client = new google.auth.OAuth2(
 process.env.GOOGLE_CLIENT_ID,
 process.env.GOOGLE_CLIENT_SECRET,
 process.env.GOOGLE_REDIRECT_URI
)

userrouter.post("/signup",(req,res)=>{
    const {email,password}=req.body;
    userModel.findOne({email:email}).then((user)=>{
        if(user){
            res.json({
                "msg":"email already exists choose another one"
            })
        }
        else{
            
            bcrypt.hash(password,saltRounds, function(err, hash) {
                if(err){
                    return res.status(500).json({ error: err.message })
                }
                const newUser=new userModel({
                    email:email,
                    password:hash

                })

                newUser.save().then((savedUser)=>{
                    res.status(201).json({ msg: "user created", user: savedUser })

                }).catch((error)=>{
                    res.status(500).json({ error: error.message })

                })

                


            });
        }

    }).catch((e)=>{
        console.log(e);
        res.json({
            "msg":"something error has happend in the finding of the user"
        })
    })
    

    

})

userrouter.post("/login",(req,res)=>{
    const {email,password}=req.body;
    userModel.findOne({email})
    .then((user)=>{
        bcrypt.compare(password, user.password, function(err, result) {
            if(result){
                const token= jwt.sign({ email:user.email }, process.env.JWT_USER_SECRET);
                res.json({
                    "token":token

                })


            }else{
                return res.json({"msg":"password is not matching try again"})
            }
            
        });

    }).catch((e)=>{
        console.log(e);
        return res.json({"msg":"we cand find you exactly"})

    })

})

userrouter.get("/alerts", authuser, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const alerts = await alertmodel
            .find({ user_id: user._id })
            .sort({ createdAt: -1 })

        return res.json({ alerts })
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch alerts", error: error.message })
    }
})

userrouter.get("/profile", authuser, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email }).select(
            "email gmailToRead whatsappNumber isGoogleConnected tokenExpiry"
        )

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        return res.json({
            profile: {
                email: user.email,
                gmailToRead: user.gmailToRead || "",
                whatsappNumber: user.whatsappNumber || "",
                isGoogleConnected: Boolean(user.isGoogleConnected),
                tokenExpiry: user.tokenExpiry || null
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message })
    }
})

userrouter.get("/auth/google/login", async (req, res) => {
    try {
        const url = await oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            state: "login",
            prompt: "consent"
        })

        return res.redirect(url)
    } catch (error) {
        return res.status(500).json({ message: "Failed to start Google login", error: error.message })
    }
})

userrouter.post("/auth/google",authuser,async (req,res)=>{
    const user=req.user;
    const { gmailToRead, whatsappNumber, forceUpdate } = req.body; // ✅ added forceUpdate
    try {
        // ✅ added: check if same gmail already exists
        const existingUser = await userModel.findOne({ email: req.user.email })
        if (existingUser.gmailToRead && existingUser.gmailToRead === gmailToRead && !forceUpdate) {
            return res.json({
                alreadyExists: true,
                msg: `You are already connected with ${gmailToRead}. Do you want to stay with this or change?`,
                currentGmail: existingUser.gmailToRead
            })
        }
        // ✅ end of added block

        await userModel.findOneAndUpdate({ email: req.user.email }, { gmailToRead, whatsappNumber })

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message })
        
    }
    
    try {
        // Let me explain: `oauth2Client` is a class object in which `generateAuthUrl` is a function
        // in which you define what things you need from the user. `accessType` means that the user
        // need not be using your website, but you can still read the data. `scope` tells the function
        // the permissions required. Responding with JSON to that URL will take you to that URL
        // with these permissions being asked for.
        const url = await oauth2Client.generateAuthUrl({
        access_type:"offline",
        scope:["https://www.googleapis.com/auth/gmail.readonly"],
        login_hint: gmailToRead,
        state:user.email,
        prompt: "consent" 
        })
        
        // return res.redirect(url) when i deploy or make the frontend mybe this will uncomment
        return res.json({url})
        
    } catch (error) {
        console.log(error)
        return res.json({
            "msg":"some error has occured at the auth google"
        })
        
    }
    

    



})

userrouter.get("/auth/google/callback",async(req,res)=>{
    const { code, state } = req.query
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173"

    try {
        const {tokens} = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        if (state === "login") {
            const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
            const profile = await oauth2.userinfo.get()
            const email = profile?.data?.email

            if (!email) {
                return res.redirect(`${frontendBaseUrl}/login?error=google_email_not_found`)
            }

            const user = await userModel.findOneAndUpdate(
                { email },
                {
                    email,
                    password: bcrypt.hashSync(process.env.GOOGLE_USER_PASSWORD_PLACEHOLDER || "google-oauth-user", saltRounds)
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )

            const token = jwt.sign({ email: user.email }, process.env.JWT_USER_SECRET)
            return res.redirect(`${frontendBaseUrl}/oauth-callback?token=${encodeURIComponent(token)}`)
        }

        const updateData = {
            accessToken: tokens.access_token,
            tokenExpiry: new Date(tokens.expiry_date),
            isGoogleConnected: true
        }
        if (tokens.refresh_token) {
            updateData.refreshToken = tokens.refresh_token
        }

        await userModel.findOneAndUpdate({ email: state }, updateData)

        const token = jwt.sign({ email: state }, process.env.JWT_USER_SECRET)
        return res.redirect(`${frontendBaseUrl}/oauth-callback?token=${encodeURIComponent(token)}`)
    } catch (error) {
        return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent("google_auth_failed")}`)
    }



 
})

module.exports={
    userrouter
}
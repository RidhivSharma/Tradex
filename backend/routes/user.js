require("dotenv").config()
const express=require("express")
const userrouter=express.Router();
const mongoose=require("mongoose");
const {google} =require("googleapis")
const bcrypt = require('bcrypt');
const { userModel } = require("../models/userdb");
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

userrouter.post("/auth/google",authuser,async (req,res)=>{
    const user=req.user;
    const { gmailToRead } = req.body;
    try {
        await userModel.findOneAndUpdate({ email: req.user.email }, { gmailToRead })

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message })
        
    }
    
    try {
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
    const {code,state} = req.query

    const {tokens} = await oauth2Client.getToken(code)

    oauth2Client.setCredentials(tokens)

    await userModel.findOneAndUpdate({email:state}, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date),
        isGoogleConnected: true
    })

    res.json({ message: "Gmail connected successfully ✅" })



 
})

module.exports={
    userrouter
}

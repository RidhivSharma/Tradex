require("dotenv").config()
const express=require("express")
const userrouter=express.Router();
const mongoose=require("mongoose");
const bcrypt = require('bcrypt');
const { userModel } = require("../models/userdb");

const saltRounds = parseInt(process.env.saltRounds)


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
                    console.log("hitting this hitng")
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



module.exports={
    userrouter
}

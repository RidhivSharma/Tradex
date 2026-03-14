const dns = require('dns');
const {userModel}=require("./models/userdb")
dns.setServers(['8.8.8.8', '8.8.4.4']);
const {userrouter}=require("./routes/user")

const mongoose=require("mongoose")
require("dotenv").config() 
const express=require("express");
const app=express();
app.use(express.json())



app.use("/user",userrouter)



mongoose.connect(process.env.mongodb_uri)
.then(()=>{
    console.log("database has been connected");
    app.listen(process.env.PORT  || 3000,()=>{
    console.log("port is running hot")
})


})
.catch((e)=>{
    console.log(e)
})


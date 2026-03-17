const dns = require('dns');
const {userModel}=require("./models/userdb")
dns.setServers(['8.8.8.8', '8.8.4.4']);
const {userrouter}=require("./routes/user")
const { alertmodel } = require("./models/alertsdb");
const { startPoller } = require("./utils/gmailPoller")
const mongoose=require("mongoose")
require("dotenv").config() 
const express=require("express");
const app=express();
app.use(express.json())


app.use(express.urlencoded({ extended: true }));

app.use("/user",userrouter)

app.post("/twilio-status", express.urlencoded({ extended: true }), async (req, res) => {
    const { MessageSid, MessageStatus } = req.body;

    console.log("📩 Twilio Update:", MessageSid, MessageStatus);

    if (MessageStatus === "delivered") {
        await alertmodel.findOneAndUpdate(
            { messageSid: MessageSid },
            { delivered: true }
        );
    }

    res.sendStatus(200);
});

mongoose.connect(process.env.mongodb_uri)
.then(()=>{
    console.log("database has been connected");
    app.listen(process.env.PORT  || 3000,()=>{
    console.log("port is running hot")
    startPoller() 
})


})
.catch((e)=>{
    console.log(e)
})


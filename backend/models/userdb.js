const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    
    email: { type: String, unique: true, required: true },  
    password: { type: String, required: true },

    
    gmailToRead: { type: String },           
    accessToken: { type: String },           
    refreshToken: { type: String },          
    tokenExpiry: { type: Date },             
    isGoogleConnected: { type: Boolean, default: false }
})

const userModel = mongoose.model("tradexusers", userSchema)
module.exports = { userModel }
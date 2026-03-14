const mongoose=require("mongoose")

const userSchmea=new mongoose.Schema({
    email:{type:String,unique:true,required:true},
    password:{type:String,rrequired:true}
})

const userModel=mongoose.model("tradexusers",userSchmea);

module.exports={
    userModel
}
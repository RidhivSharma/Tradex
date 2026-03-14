const mongoose=require("mongoose")
const alertsdbschema=new mongoose.Schema({
    "symbol":{type:String},
    "price":{type:Number},
    "signal":{type:signal},
    "user_id":{type:mongoose.Schema.type.ObjectId}
    
},
{ timestamps: true }
)


const alertmodel=mongoose.model("alertslog",alertsdbschema)
module.exports={
    alertmodel
}
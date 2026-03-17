const mongoose=require("mongoose")
const alertsdbschema = new mongoose.Schema({
    symbol: { type: String },
    price: { type: Number },
    signal: { type: String },                               // ✅ was "signal" (undefined variable)
    user_id: { type: mongoose.Schema.Types.ObjectId },      // ✅ was mongoose.Schema.type (wrong)
    whatsappSent: { type: Boolean, default: false }         // ✅ track if notification was sent
},
{ timestamps: true }
)


const alertmodel=mongoose.model("alertslog",alertsdbschema)
module.exports={
    alertmodel
}
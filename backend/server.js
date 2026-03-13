const express=require("express");
const app=express();

app.get("/",(req,res)=>{
    res.json({
        "msg":"this is somehting"
    })
})

app.listen(3000,()=>{
    console.log("port is running hot")
})
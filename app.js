const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require("mongoose");
// routes import
const userRoute = require("./routes/user.route");
const transtionRoute = require("./routes/transtion.route");
const { transtion } = require("./controller/transtion.controller");
const User = require("./models/user.model");
const Transtion = require("./models/transtion.model");
const imageUploadRoutes = require('./routes/imageUpload.route')
// middleware
app.use(express.json());
app.use(cors());

// routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/upload", imageUploadRoutes);


const client = new MongoClient(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// route hit
app.get("/", (req, res, next) => {
  res.send(
    `<h1 style="color:#242B2E;font-size:62px; text-align:center;margin-top:200px">Welcome To Our Gen Zam Bank Server...</h1>`
  );
});


module.exports = app;


app.get("/test",async(req,res) =>{
  try{
    const allinfo = await Transtion.find({});
    res.send({status:"ok",data:allinfo});

  }
  catch(error){

    console.log(error);
  }
})

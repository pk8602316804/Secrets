//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

mongoose.set('strictQuery',true);
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB").then(()=>{
    console.log("Connected Successfully to Database !!");
}).catch((err)=>{
    console.log("Error in connect to DB");
})

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


userSchema.plugin(encrypt,{ secret:process.env.SECRET, encryptedFields: ["password"]});    

const User  = new mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render(__dirname+"/views/home");
});

app.get("/login",(req,res)=>{
    res.render(__dirname+"/views/login");
});

app.get("/register",(req,res)=>{
    res.render(__dirname+"/views/register");
});

app.post("/register",(req,res)=>{
    
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });
    newUser.save().then(()=>{
        res.render(__dirname+"/views/secrets");
    }).catch((err)=>{
        console.log("Error in registration");
    });
});

app.post("/login",(req,res)=>{
    const formUsername = req.body.username;
    const formPassword = req.body.password;

    User.findOne({email : formUsername }).then((foundUser)=>{
        if(foundUser.password == formPassword){
            console.log("Succesfully Loged in");
            res.render(__dirname+"/views/secrets");
        }
        else{
            console.log("Wrong password");
        }
    })
})

app.listen(3000,()=>{
    console.log("Started server at port 3000");
})
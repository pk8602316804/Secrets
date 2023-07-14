//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRound = 10;

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
    
    bcrypt.hash(req.body.password,saltRound,(err,hash)=>{
        const newUser = new User({
            email : req.body.username,  
            password :  hash
        });
        newUser.save().then(()=>{
            res.render(__dirname+"/views/secrets");
        }).catch((err)=>{
            console.log("Error in registration");
        });
    })

    
});

app.post("/login",(req,res)=>{
    const formUsername = req.body.username;
    const formPassword = req.body.password;

    User.findOne({email : formUsername }).then((foundUser)=>{
        bcrypt.compare(formPassword,foundUser.password,(err,result)=>{
            if(result){
                console.log("Succesfully Loged in");
                res.render(__dirname+"/views/secrets");
            }
            else{
                console.log("Wrong password");
            }
        })
    })
})

app.listen(3000,()=>{
    console.log("Started server at port 3000");
})
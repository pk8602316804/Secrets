//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

mongoose.set('strictQuery',true);
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session()); 

mongoose.connect("mongodb://127.0.0.1:27017/userDB").then(()=>{
    console.log("Connected Successfully to Database !!");
}).catch((err)=>{
    console.log("Error in connect to DB");
})

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);  
userSchema.plugin(findOrCreate); 

const User  = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(null,user.id);
    });
});

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true,
    userProfileURL : "http://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    // console.log(profile);
    User.findOrCreate({ username:profile.displayName ,googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render(__dirname+"/views/home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope:[ "email", "profile" ] }) 
);

app.get( "/auth/google/secrets",
    passport.authenticate( "google", {failureRedirect: "/login"}),(req,res)=>{
        res.redirect("/secrets");  
    }
);

app.get("/login",(req,res)=>{
    res.render(__dirname+"/views/login");
});

app.get("/register",(req,res)=>{
    res.render(__dirname+"/views/register");
});

app.get("/secrets",(req,res)=>{
    User.find({"secret":{$ne:null}} , (err,foundUsers)=>{
        if(err)
            console.log(err);
        else{
            if(foundUsers){
                res.render("secrets",{userWithSecrets:foundUsers});
            }
        }
    } ) 
})

app.post("/register",(req,res)=>{
    User.register({username:req.body.username} , req.body.password ,(err, user)=>{
        if(!err){
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }else{
            console.log(err);
            res.redirect("/register"); 
        }
    } )
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname+"/views/submit");
    }else{
        res.redirect('/login');
    }
})

app.post("/submit",(req,res)=>{
    const submittedSecret  = req.body.secret;
    console.log(req.user);
    User.findById(req.user,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(()=>{
                    res.redirect("/secrets");
                })
            }    
        }
    });
});

app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err)
            console.log(err);
        else
            res.redirect("/");
    });
})



app.post("/login",(req,res)=>{
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user,(err)=>{
        if(err)
            console.log(err);
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    })
})

app.listen(3000,()=>{
    console.log("Started server at port 3000");
})
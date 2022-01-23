require('dotenv').config()
const express = require("express")
const body_parser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate")


const app = express()

app.use(express.static("public"))
app.use(body_parser.urlencoded({extended: true}))
app.set("view engine", "ejs")


const userSchema = new mongoose.Schema({
    name: String,
    pass: String,
    secret: String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model("User",userSchema)
mongoose.connect("mongodb://localhost:27017/userDB");

app.use(session({
    secret: "My name is joker.",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.listen(3000,()=>{
    console.log("Listening on 3000.....")
})

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }))

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
})

app.get("/",(req,res)=>{
    res.render("home")
})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.get("/secrets",(req,res)=>{
    User.find({secret: {$ne: null}},(err,foundUser)=>{
       if(!err) res.render("secrets",{userInfo: foundUser})
       else console.log(err)
    })
})

app.get("/logout",(req,res)=>{
    req.logout()
    res.redirect("/")
})

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()) res.render("submit")
    else res.redirect("/login")
})

app.post("/register",(req,res)=>{
   User.register({username: req.body.username}, req.body.password, (err,user)=>{
       if(err) console.log(err)
       else {
           passport.authenticate("local")(req,res,()=>{
               res.redirect("/secrets")
           })
       }
   })
})

app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user,(err)=>{
        if(!err) {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            })
        }
    })
})

app.post("/submit",(req,res)=>{
    const submitSecret = req.body.secret;
    User.findById(req.user.id, (err,foundUser)=>{
        if(!err) {
            if(foundUser){
                foundUser.secret = submitSecret
            foundUser.save(()=>{
                res.redirect("/secrets")
            });
            }
            
        } else { console.log(err) }
    })
})

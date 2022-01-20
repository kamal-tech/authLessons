const express = require("express")
const body_parser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express()

app.use(express.static("public"))
app.use(body_parser.urlencoded({extended: true}))
app.set("view engine", "ejs")
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    name: String,
    pass: String
})

const User = new mongoose.model("User",userSchema)

app.listen(3000,()=>{
    console.log("Listening on 3000.....")
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

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newPass = hash;
        const newUser = new User({
            name: req.body.username,
            pass: newPass
        })
        newUser.save()
        res.render("secrets")
    })
})

app.post("/login",(req,res)=>{
    
    User.findOne({name: req.body.username},(err,foundUser)=>{
        if(!err) {
            if(foundUser){ bcrypt.compare(req.body.password, foundUser.pass, (err,result)=>{
                if(result === true) res.render("Secrets")
            })
        }
        } else res.render(err)
    })
})

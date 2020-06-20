require('dotenv').config();
const express= require('express');
const bodyParser= require('body-parser');
const ejs= require('ejs');
const mongoose= require('mongoose');
const bcrypt= require('bcrypt');
const saltRounds= 10;

const app= express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser:true, useUnifiedTopology:true });

const userSchema= new mongoose.Schema({
    email: String,
    password: String
});

// Adding auth by encrypting our password with a key of secret which can be any string

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User= new mongoose.model("User", userSchema);

app.get("/", (req,res) => {
    res.render("home");
})

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/register", (req,res) => {
    res.render("register");
});

app.post("/register", (req,res) => {

    bcrypt.hash(req.body.password, saltRounds, (err,hash) => {
        const newUser= new User({
        email: req.body.username, 
        password: hash
        });
        newUser.save((err) => {
            if(err)
            console.log(err)
            else
            res.render("secrets");
        })  
    })
});

app.post("/login", (req,res) => {

    const username= req.body.username;
    const password= req.body.password;

    User.findOne({ email: username }, (err,doc) => {
        if(!doc)
        res.send("No User Found");
        else if(doc){
            bcrypt.compare(password, doc.password, (err, result) => {
                if(result)
                res.render("secrets");
                else
                res.send("Password Didnt Match")
            })}       
        else
        console.log(err);
    })
})

app.listen(3000, () => {
    console.log("Server Is Up And running");
})
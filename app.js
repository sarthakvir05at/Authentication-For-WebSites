const express= require('express');
const bodyParser= require('body-parser');
const ejs= require('ejs');
const mongoose= require('mongoose');
const encrypt= require('mongoose-encryption');

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

const secret= "I Am Sherlock Holmes And Upto A Murder Mystery";
userSchema.plugin(encrypt, { secret, encryptedFields: ["password"] });

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

    const newUser= new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err) => {
        if(err)
        console.log(err)
        else
        res.render("secrets");
    })
});

app.post("/login", (req,res) => {

    const username= req.body.username;
    const password= req.body.password;

    User.findOne({ email: username }, (err,doc) => {
        if(!doc)
        res.send("No User Found");
        else if(doc){
            if(password === doc.password)
            res.render("secrets");
            else
            res.send("User Or Password Didnt Match");
        }       
        else
        console.log(err);
    })
})

app.listen(3000, () => {
    console.log("Server Is Up And running");
})
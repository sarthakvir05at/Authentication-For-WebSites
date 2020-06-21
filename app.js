require('dotenv').config();
const express= require('express');
const bodyParser= require('body-parser');
const ejs= require('ejs');
const mongoose= require('mongoose');
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate= require('mongoose-findorcreate');

const app= express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

//Initialising Session
app.use(session({
    secret: "A Good Murder Mystery",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());  // Initializing Passport
app.use(passport.session());     // use passport to manage our sessions

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser:true, useUnifiedTopology:true });
mongoose.set("useCreateIndex", true);       // Depreciation Warning

const userSchema= new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose); // using passportLocalMongoose as a plugin for userSchema
userSchema.plugin(findOrCreate);

// Adding auth by encrypting our password with a key of secret which can be any string

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User= new mongoose.model("User", userSchema);

passport.use(User.createStrategy());  // create local login strategy using passport

//setting passport to serialize and deserialize User
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
// Using oAuth And configuring with the google oauth
// Also findOrCreate want a method before so mongoose converted it to method and need to install mongoose-findOrCreate
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req,res) => {
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/register", (req,res) => {
    res.render("register");
});

app.get("/secrets", (req,res) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", (req,res) => {

    req.logout();
    res.redirect("/");
})

app.post("/register", (req,res) => {

    User.register({username: req.body.username}, req.body.password, (err,doc) => {
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,() => {
                res.redirect("/secrets");
            });
        };
    });
});

app.post("/login", (req,res) => {

    const newUser= new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(newUser, (err) => {
        if(err)
        console.log(err);
        else
        passport.authenticate("local")(req,res,() => {
        res.redirect("/secrets");
        })
    })
})

app.listen(3000, () => {
    console.log("Server Is Up And running");
})
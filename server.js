const mongoose = require('mongoose');
const express = require('express');
const port = process.env.PORT || 5000;
const asyncHandler = require('express-async-handler');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


const app = express();

const User = require('./models/user');
const Message = require('./models/message');

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
require('dotenv').config();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})


//mongodb / mongoose
mongoose.set('strictQuery', false);
const mongoDB = process.env.DATABASE_URL;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

main()
.then(err =>{
  if (!err) {
    console.log('Connected to db successfully!')
  }
} )
.catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

//routes

app.post('/chat', asyncHandler(async(req, res) => {
  const messagesList = await Message.find({
      $or: [
          { sender_username: req.body.rec_user, receiver_username: req.body.req_user },
          { sender_username: req.body.req_user, receiver_username: req.body.rec_user },
      ]
  })
  res.json({
      requester: req.body.id,
      parameter_user: req.params.id,
      messages: messagesList
  })
}));

app.post("/messages/create", bodyParser.json(), asyncHandler(async(req, res) => {
  await Message.create({
      sender_username: req.body.sender,
      receiver_username: req.body.receiver,
      text: req.body.text
  });
  res.json({
      message: "message submitted"
  });
}));

app.get("/users", asyncHandler(async(req, res) => {
    const userNames = await User.find({});
    res.json({
        "allUsers": userNames
    })
}));

app.post("/signup", bodyParser.json(), async(req, res) => {
  if (req.body.username === undefined || req.body.password === undefined || req.body.email === undefined) {
    res.send("No username or password given!");
  } else {
  const hashPassword = await bcryptjs.hash(req.body.password, 10);
  const newUser = new User({
      username: req.body.username,
      password: hashPassword,
      email: req.body.email
  });
  await newUser.save();
  res.sendStatus(200);
}
})

function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  };
};

passport.use(
  new LocalStrategy(async(username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      };
      bcryptjs.compare(password, user.password, (err, result) => {
        if (err) throw err;
        if (result === true) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
    } catch(err) {
      return done(err);
    };
  })
);  

app.post("/login", bodyParser.json(), passport.authenticate("local"), (req, res) => {
  jwt.sign({ username: req.body.username, password: req.body.password }, 'secretKey', (err, token) => {
    res.json({
      token
    });
  })
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

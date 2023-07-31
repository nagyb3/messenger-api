const mongoose = require('mongoose');
const express = require('express');
const port = process.env.PORT || 5000;
const asyncHandler = require('express-async-handler');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const User = require('./models/user');
const Message = require('./models/message');

app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

require('dotenv').config();

app.post('/chat/:userid', asyncHandler(async(req, res) => {
    const messagesList = await Message.find({
        $or: [
            { sender_username: req.params.userid, receiver_username: req.body.req_user },
            { sender_username: req.body.req_user, receiver_username: req.params.userid },
        ]
    })
    res.json({
        requester: req.body.id,
        parameter_user: req.params.id,
        messages: messagesList
    })
}));

app.post("/messages/create", asyncHandler(async(req, res) => {
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

app.post("/signup", asyncHandler(async(req, res) => {
    //TODO: check if username already exists
    await User.create({
        username: req.body.username,
        password: req.body.password
    })
    res.json({
        "message": "user created"
    })
}));

mongoose.set('strictQuery', false);
const mongoDB = process.env.DATABASE_URL;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}
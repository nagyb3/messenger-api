const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sender_username: {
        type: String,
        required: true
    },
    receiver_username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }, 
    creation_date: {
        type: Date,
        default: new Date()
    }
})

module.exports = mongoose.model("Message", MessageSchema)
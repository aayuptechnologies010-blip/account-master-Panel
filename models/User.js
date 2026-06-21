const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: null,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
});

module.exports = mongoose.model('User', userSchema);
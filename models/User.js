const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin', 'user'],
    default: 'admin',
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
});

module.exports = mongoose.model('User', userSchema);
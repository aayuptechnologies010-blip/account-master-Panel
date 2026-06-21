const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    const admin = require('../config/firebase');
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number: phone } = decoded;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number not found in token' });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, firebaseUid: uid });
    } else {
      user.firebaseUid = uid;
    }
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token });
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Firebase token expired' });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
    }
    console.error('Auth error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true });
};

// Register — phone + password se naya user banao
exports.register = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'phone aur password dono required hain' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Is phone number se account already exist karta hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ phone, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Login — phone + password match karo, token do
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'phone aur password dono required hain' });
    }

    const user = await User.findOne({ phone });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Phone number ya password galat hai' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Phone number ya password galat hai' });
    }

    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DEV ONLY — skip Firebase, get a JWT directly using a phone number
// Remove this or keep NODE_ENV != 'development' in production
exports.devLogin = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'phone is required' });
    }
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error('devLogin error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

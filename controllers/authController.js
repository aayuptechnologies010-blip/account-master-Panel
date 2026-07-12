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

// Register — email + password se naya user banao
exports.register = async (req, res) => {
  try {
    const { email, password, phone, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email aur password required hain' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Is email se account already exist karta hai' });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Is phone number se account already exist karta hai' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: cleanEmail,
      phone,
      name,
      password: hashedPassword
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id:   user._id,
        phone: user.phone,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Login — email + password match karo, token do
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email aur password dono required hain' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id:   user._id,
        phone: user.phone,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'mobile required hai' });
    }

    const user = await User.findOne({ phone: mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Is mobile se koi account nahi mila' });
    }

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp       = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    const response = { success: true, message: 'OTP generate ho gaya' };
    if (process.env.NODE_ENV !== 'production') response.otp = otp;
    res.json(response);
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.newPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'otp, newPassword aur confirmPassword required hain' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'newPassword aur confirmPassword match nahi karte' });
    }

    const user = await User.findOne({ resetOtp: otp });
    if (!user) {
      return res.status(400).json({ success: false, message: 'OTP galat hai' });
    }

    if (new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expire ho gaya, dobara try karo' });
    }

    user.password       = await bcrypt.hash(newPassword, 10);
    user.resetOtp       = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password successfully reset ho gaya' });
  } catch (err) {
    console.error('newPassword error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get logged-in user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -firebaseUid -resetOtp -resetOtpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update logged-in user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select('-password -firebaseUid -resetOtp -resetOtpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('updateProfile error:', err);
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

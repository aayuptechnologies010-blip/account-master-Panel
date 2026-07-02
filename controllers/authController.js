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
      { id: user._id, email: user.email, phone: user.phone, role: user.role },
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

// Register — email/phone + password se naya user banao
exports.register = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({ success: false, message: 'phone/email aur password required hain' });
    }

    const query = email ? { email: email.toLowerCase() } : { phone };
    const existing = await User.findOne(query);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Account already exist karta hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      phone,
      email: email ? email.toLowerCase() : undefined,
      password: hashedPassword
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Register SuperAdmin — email + password se naya superadmin banao
exports.registerSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email aur password required hain' });
    }

    // Protect endpoint: only allow registering one superadmin
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      return res.status(400).json({ success: false, message: 'Superadmin account already exists. Duplicate creation via API is blocked.' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Is email address se account already exist karta hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin'
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, userId: user._id, message: 'Superadmin registered successfully' });
  } catch (err) {
    console.error('registerSuperAdmin error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Login — email/phone + password match karo, token do
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    console.log('Login attempt received. Email:', email, 'Phone:', phone);

    if ((!phone && !email) || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ success: false, message: 'email/phone aur password dono required hain' });
    }

    const query = email ? { email: email.toLowerCase() } : { phone };
    console.log('DB Query:', query);
    const user = await User.findOne(query);
    if (!user) {
      console.log('Login failed: User not found in database');
      return res.status(401).json({ success: false, message: 'Email/Phone ya password galat hai' });
    }

    if (!user.password) {
      console.log('Login failed: User has no password set in database');
      return res.status(401).json({ success: false, message: 'Email/Phone ya password galat hai' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ success: false, message: 'Email/Phone ya password galat hai' });
    }

    console.log('Login successful. Generating token for user ID:', user._id);
    const token = jwt.sign(
      { id: user._id, email: user.email, phone: user.phone, role: user.role },
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
      { id: user._id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, userId: user._id });
  } catch (err) {
    console.error('devLogin error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

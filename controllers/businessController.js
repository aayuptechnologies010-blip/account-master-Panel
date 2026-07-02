const Business = require('../models/Business');

exports.getBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findOne({ userId: req.user.id });
    res.json({ success: true, business: business || {} });
  } catch (err) {
    console.error('getBusinessProfile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateBusinessProfile = async (req, res) => {
  try {
    let business = await Business.findOne({ userId: req.user.id });
    const { businessName, ownerName, phone, email, address } = req.body;
    const allowed = { businessName, ownerName, phone, email, address };
    if (!business) {
      business = new Business({ ...allowed, userId: req.user.id });
    } else {
      Object.assign(business, allowed);
    }
    await business.save();
    res.json({ success: true, business });
  } catch (err) {
    console.error('updateBusinessProfile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

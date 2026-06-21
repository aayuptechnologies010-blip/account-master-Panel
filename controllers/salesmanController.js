const mongoose = require('mongoose');
const Salesman = require('../models/Salesman');

exports.getSalesmen = async (req, res) => {
  try {
    const salesmen = await Salesman.find({ userId: req.user.id });
    res.json({ success: true, salesmen });
  } catch (err) {
    console.error('getSalesmen error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.addSalesman = async (req, res) => {
  try {
    const count = await Salesman.countDocuments({ userId: req.user.id });
    const code = req.body.code || `SM${String(count + 1).padStart(3, '0')}`;
    const salesman = new Salesman({ ...req.body, code, userId: req.user.id });
    await salesman.save();
    res.status(201).json({ success: true, salesman });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Salesman code already exists' });
    }
    console.error('addSalesman error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateSalesman = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid salesman ID' });
    }
    const { name, code, phone, email, area } = req.body;
    const salesman = await Salesman.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, code, phone, email, area },
      { new: true }
    );
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found' });
    res.json({ success: true, salesman });
  } catch (err) {
    console.error('updateSalesman error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteSalesman = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid salesman ID' });
    }
    const salesman = await Salesman.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteSalesman error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

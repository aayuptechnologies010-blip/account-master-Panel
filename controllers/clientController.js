const mongoose = require('mongoose');
const Client = require('../models/Client');

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.user.id });
    res.json(clients);
  } catch (err) {
    console.error('getClients error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.addClient = async (req, res) => {
  try {
    const count = await Client.countDocuments({ userId: req.user.id });
    const prtCd = `RST${String(count + 1).padStart(3, '0')}`;

    const client = new Client({
      ...req.body,
      userId: req.user.id,
      sr: count + 1,
      prtCd,
    });

    await client.save();
    res.status(201).json({ success: true, client });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Party code already exists, please retry' });
    }
    console.error('addClient error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid client ID' });
    }
    const { partyName, add1, add2, add3, pinCode, contactNo, partyGstinNo, areaCd, areaName } = req.body;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { partyName, add1, add2, add3, pinCode, contactNo, partyGstinNo, areaCd, areaName },
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    console.error('updateClient error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid client ID' });
    }
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteClient error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

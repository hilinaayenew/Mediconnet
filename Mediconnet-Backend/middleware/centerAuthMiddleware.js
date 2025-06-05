const mongoose = require('mongoose');
const Hospital = require('../models/hospital');

const authenticateHospital = async (req, res, next) => {
  try {
    const secretKey = req.headers['x-api-key']?.trim();
    const hospitalID = req.headers['hospitalid']?.trim(); 

    if (!secretKey || !hospitalID) {
      return res.status(401).json({ error: 'API key and hospital ID are required' });
    }
    consolde.log(hospitalID)

    if (!mongoose.Types.ObjectId.isValid(hospitalID)) {
      return res.status(400).json({ error: 'Invalid hospital ID format' });
    }

    const hospital = await Hospital.findById(hospitalID);
    console.log(hospital)
    if (!hospital) {
      consolde.log(hospitalID)
      return res.status(404).json({ error: 'Hospital not found' });
    }

    if (secretKey !== hospital.secretKey) {
      return res.status(401).json({ error: 'Invalid API key or hospital not approved' });
    }

    req.hospital = hospital;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = { authenticateHospital };

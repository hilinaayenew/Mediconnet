// routes/patientHistoryRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateHospital } = require('../middleware/centerAuthMiddleware');
const { 
  updatePatientHistory, 
  getPatientHistory,
  listPatients 
} = require('../controllers/CentralPatientHistoryController');

router.post('/records', authenticateHospital, updatePatientHistory);

router.get('/records/:faydaID', getPatientHistory);

router.get('/patients',  listPatients);


module.exports = router;
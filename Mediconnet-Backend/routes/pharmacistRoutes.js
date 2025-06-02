// routes/pharmacist.js
const express = require("express")
const router = express.Router()
const pharmacistController = require("../controllers/pharmacistController")
const authMiddleware = require("../middleware/authmiddleware")

// Search patients
router.get("/patients", authMiddleware,
  pharmacistController.searchPatients
)
router.get("/patients/:id", authMiddleware,
  pharmacistController.getPatients
)

// Get patient prescriptions
router.get("/prescriptions/:patientId", authMiddleware,
  pharmacistController.getPatientPrescriptions
)


module.exports = router
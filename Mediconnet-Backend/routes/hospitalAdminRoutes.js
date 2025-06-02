const express = require("express");
const router = express.Router();
const {
  addStaffAccount,
  getStaffAccounts,
  deleteStaffAccount,
  viewPatientsByHospital,
  getHospitalDetails,
  getStaff,
  searchPatients,
  getPatients,
  getMedcicalOfPatient,
  searchPatient,
  getPatient,
  getMedicalOfPatient,
} = require("../controllers/hospitalAdminController");
const authMiddleware = require("../middleware/authmiddleware");

router.get("/staff", authMiddleware, getStaffAccounts);
router.get("/getStaffAccount/:id", authMiddleware, getStaff);
router.get("/hospitals/:id", authMiddleware, getHospitalDetails
);
router.post("/add-staff", authMiddleware, addStaffAccount);
router.delete("/staff/:staffId", authMiddleware, deleteStaffAccount);

router.get("/patients/:hospitalID", authMiddleware, viewPatientsByHospital);


router.get("/fayda/:id/hospital/:hospitalID", authMiddleware,getMedicalOfPatient
);
router.get("/patients", authMiddleware,
  searchPatient
)
router.get("/patients/:id", authMiddleware,
  getPatient
)
module.exports = router;

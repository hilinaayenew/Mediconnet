// controllers/pharmacistController.js
const Patient = require("../models/patient");
const Prescription = require("../models/prescription");

// Search patients by name or Fayda ID
exports.searchPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const hospitalId = req.user.hospitalId;

    let query = {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { faydaID: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } }
      ]
    };

    const patients = await Patient.find(query)
      .select("firstName lastName faydaID contactNumber gender status")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Patient.countDocuments(query);

    res.json({
      patients,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    res.status(500).json({ message: "Error searching patients" });
  }
};

// Get all prescriptions for a patient in the current hospital
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.user.hospitalId;
    const { searchDate } = req.query;

    let query = {
      patientID: patientId,
      doctorID: { $exists: true }, // Ensure it's from a doctor
      "doctorID.hospital": hospitalId
    };

    if (searchDate) {
      const startDate = new Date(searchDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(searchDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.datePrescribed = { $gte: startDate, $lte: endDate };
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: "doctorID",
        select: "firstName lastName"
      })
      .sort({ datePrescribed: -1 }) // Newest first
      .lean();

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ message: "Error fetching prescriptions" });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const id = req.params.id;
    const hospitalId = req.user.hospitalID
   
      const patients = await Patient.findById(id)

     

    res.status(200).json({
      success: true,
      data:patients
    })
  } catch (error) {
    console.error('Error fetching  patients:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}
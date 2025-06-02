const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/patient");
const LabRequest = require("../models/LabRequest");
const Prescription = require("../models/prescription");
const Doctor = require("../models/doctor");
const mongoose = require("mongoose");
const axios = require("axios");
const CenteralPatientHistory = require("../models/CenteralPatientHistory");
// ==================== DOCTOR PROFILE ====================


const getStaffAccount = async (req, res) => {
  try {
    const { id } = req.params;

   
    const doctor = await Doctor.findById(id)
      .populate('hospitalID', 'name location contactNumber')
      .populate('assignedPatientID', 'faydaID firstName lastName status');

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

   
    const responseData = {
      _id: doctor._id,
      email: doctor.email,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      dateOfBirth: doctor.dateOfBirth,
      gender: doctor.gender,
      role: doctor.role,
      contactNumber: doctor.contactNumber,
      address: doctor.address,
      specialization: doctor.specialization,
      hospital: doctor.hospitalID,
      assignedPatients: doctor.assignedPatientID,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getStaffAccount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getAssignedPatients = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { search } = req.query;

    const searchQuery = {
      currentDoctor: doctorId,
      status: { $in: ["Assigned", "InTreatment"] }
    };

    if (search) {
      searchQuery.$or = [
        { 'patientDetails.faydaID': { $regex: search, $options: 'i' } },
        { 'patientDetails.firstName': { $regex: search, $options: 'i' } },
        { 'patientDetails.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const records = await MedicalRecord.find(searchQuery)
      .populate({
        path: 'patientID',
        select: 'faydaID firstName lastName gender dateOfBirth bloodGroup status'
      })
      .sort({ createdAt: -1 });
    const patients = records.map(record => ({
      medicalRecordId: record._id,
      status: record.status,
      ...record.patientID.toObject()
    }));
    

    res.status(200).json({ 
      success: true, 
      count: patients.length,
      data: patients 
    });
  } catch (error) {
    console.error("Error in getAssignedPatients:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching patients" 
    });
  }
};


const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid ID format" 
      });
    }

    const hasAccess = await MedicalRecord.exists({
      patientID: patientId,
      currentDoctor: doctorId
    });

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have access to this patient's records" 
      });
    }

    // Get patient with all related data
    const patient = await Patient.findById(patientId)
      .select('-__v -password')
      .populate({
        path: 'assignedDoctor',
        select: 'firstName lastName specialization'
      })
      .populate({
        path: 'registeredHospital',
        select: 'name location contactNumber'
      })
      .lean();

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    // Get all medical records for this patient
    const medicalRecords = await MedicalRecord.find({
      patientID: patientId
    })
    .sort({ createdAt: -1 })
    .populate('currentDoctor', 'firstName lastName specialization')
    .populate('triageData.staffID', 'firstName lastName role')
    .populate({
      path: 'doctorNotes.prescriptions',
      populate: {
        path: 'medicineList',
        model: 'Medicine'
      }
    })
    .populate('labRequests')
    .lean();

    // Get current active record if exists
    const currentRecord = medicalRecords.find(record => 
      ['Assigned', 'InTreatment'].includes(record.status)
    );

    // Structure response data
    const responseData = {
      success: true,
      data: {
        patient: {
          basicInfo: {
            faydaID: patient.faydaID,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: `${patient.firstName} ${patient.lastName}`,
            dateOfBirth: patient.dateOfBirth,
            age: calculateAge(patient.dateOfBirth),
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            contactNumber: patient.contactNumber,
            address: patient.address,
            status: patient.status
          },
          medicalInfo: {
            medicalHistory: patient.medicalHistory,
            allergies: patient.allergies || []
          },
          emergencyContact: patient.emergencyContact,
          hospitalInfo: {
            registeredHospitals: patient.registeredHospital,
            assignedDoctor: patient.assignedDoctor
          }
        },
        currentVisit: currentRecord ? {
          recordId: currentRecord._id,
          status: currentRecord.status,
          createdAt: currentRecord.createdAt,
          updatedAt: currentRecord.updatedAt,
          doctor: currentRecord.currentDoctor,
          triageData: currentRecord.triageData,
          doctorNotes: currentRecord.doctorNotes,
          labRequests: currentRecord.labRequests || []
        } : null,
        medicalHistory: medicalRecords.map(record => ({
          recordId: record._id,
          status: record.status,
          date: record.createdAt,
          doctor: record.currentDoctor,
          triage: record.triageData ? {
            vitals: record.triageData.vitals,
            chiefComplaint: record.triageData.chiefComplaint,
            urgency: record.triageData.urgency,
            triagedBy: record.triageData.staffID
          } : null,
          diagnosis: record.doctorNotes?.diagnosis || 'Not documented',
          treatment: record.doctorNotes?.treatmentPlan || 'Not documented',
          prescriptions: record.doctorNotes?.prescriptions || [],
          labRequests: record.labRequests || []
        }))
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error in getPatientProfile:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching patient profile",
      error: error.message 
    });
  }
};
/**
 * Change medical record status from Assigned to InTreatment
 */
const startTreatment = async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user?._id;

    const record = await MedicalRecord.findOneAndUpdate(
      {
        _id: recordId,
        currentDoctor: doctorId,
        status: "Assigned"
      },
      {
        status: "InTreatment",
        updatedAt: new Date()
      },
      { new: true }
    );
    



    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Record not found, not assigned to you, or not in 'Assigned' status"
      });
    }

    res.status(200).json({
      success: true,
      message: "Treatment started successfully",
      data: record
    });
  } catch (error) {
    console.error("Error in startTreatment:", error);
    res.status(500).json({
      success: false,
      message: "Server error starting treatment"
    });
  }
};

// ==================== MEDICAL RECORDS ====================

// ==================== PATIENT MEDICAL HISTORY ====================

/**
 * Get complete medical history for a patient
 */
const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user?._id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid ID format" 
      });
    }

    // Check if doctor has access to this patient
    const hasAccess = await MedicalRecord.exists({
      patientID: patientId,
      currentDoctor: doctorId
    });

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have access to this patient's records" 
      });
    }

    // Get all medical records for this patient
    const records = await MedicalRecord.find({ 
      patientID: patientId
    })
    .sort({ createdAt: -1 })
    .populate('currentDoctor', 'firstName lastName specialization')
    .populate('triageData.staffID', 'firstName lastName role')
    .populate({
      path: 'doctorNotes.prescriptions',
      
    })
    .populate('labRequests')
    .lean();

    // Get basic patient info
    const patient = await Patient.findById(patientId)
      .select('faydaID firstName lastName dateOfBirth gender bloodGroup')
      .lean();

    // Transform data for better frontend consumption
    const medicalHistory = records.map(record => ({
      recordId: record._id,
      status: record.status,
      date: record.createdAt,
      doctor: record.currentDoctor,
      triage: record.triageData ? {
        vitals: record.triageData.vitals,
        chiefComplaint: record.triageData.chiefComplaint,
        urgency: record.triageData.urgency,
        triagedBy: record.triageData.staffID
      } : null,
      diagnosis: record.doctorNotes?.diagnosis || 'Not documented',
      treatment: record.doctorNotes?.treatmentPlan || 'Not documented',
      prescriptions: record.doctorNotes?.prescriptions || [],
      labRequests: record.labRequests || []
    }));

    res.status(200).json({ 
      success: true,
      count: medicalHistory.length,
      data: {
        patient: {
          faydaID: patient.faydaID,
          name: `${patient.firstName} ${patient.lastName}`,
          age: calculateAge(patient.dateOfBirth),
          gender: patient.gender,
          bloodGroup: patient.bloodGroup
        },
        medicalHistory
      }
    });

  } catch (error) {
    console.error("Error in getPatientMedicalHistory:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching medical history",
      error: error.message
    });
  }
};

// Helper function to calculate age from date of birth
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
// Helper function to calculate age from date of birth
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
/**
 * Get single medical record details
 */
const getMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user?._id;


    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(recordId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      console.log("Invalid ID format");
      return res.status(400).json({ 
        success: false,
        message: "Invalid ID format" 
      });
    }

    // Convert string IDs to ObjectId if needed
    const recordObjectId = new mongoose.Types.ObjectId(recordId);
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

   
    const record = await MedicalRecord.findOne({
      _id: recordObjectId,
      $or: [
        { currentDoctor: doctorObjectId },
        
      ]
    })
    .populate({
      path: 'patientID',
      select: 'faydaID firstName lastName gender dateOfBirth',
      model: 'Patient'
    })
    .populate({
      path: 'currentDoctor',
      select: 'firstName lastName',
      model: 'Doctor'
    })
    .populate({
      path: 'triageData.staffID',
      select: 'firstName lastName role',
      model: 'User'
    })
    .populate({
      path: 'doctorNotes.prescriptions',
      model: 'Prescription'
    });


    if (!record) {
      // Additional check to see if record exists at all
      const recordExists = await MedicalRecord.exists({ _id: recordObjectId });
      
      if (!recordExists) {
        console.log("Record doesn't exist in database");
        return res.status(404).json({ 
          success: false,
          message: "Medical record not found" 
        });
      }

      // Check if doctor is assigned
      const isDoctorAssigned = await MedicalRecord.exists({
        _id: recordObjectId,
        $or: [
          { currentDoctor: doctorObjectId },
         
        ]
      });

      console.log("Is doctor assigned:", isDoctorAssigned);

      return res.status(403).json({ 
        success: false,
        message: "You are not authorized to access this record" 
      });
    }

    // Transform the data
    const responseData = {
      _id: record._id,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      patient: record.patientID,
      currentDoctor: record.currentDoctor,
      
      triageData: record.triageData ? {
        vitals: record.triageData.vitals,
        chiefComplaint: record.triageData.chiefComplaint,
        urgency: record.triageData.urgency,
        staff: record.triageData.staffID,
        completedAt: record.triageData.completedAt
      } : null,
      doctorNotes: record.doctorNotes ? {
        diagnosis: record.doctorNotes.diagnosis,
        treatmentPlan: record.doctorNotes.treatmentPlan,
        prescriptions: record.doctorNotes.prescriptions
      } : null
    };

    res.status(200).json({ 
      success: true,
      data: responseData 
    });
  } catch (error) {
    console.error("Error in getMedicalRecord:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching record",
      error: error.message
    });
  }
};


const syncToCentralPatientHistory = async (record) => {
  try {
    const { _id: recordId } = record;
    console.log("Syncing record to central patient history:", recordId);

    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate('patientID', 'faydaID firstName lastName dateOfBirth gender bloodGroup')
      .populate('hospitalID', 'secreteKey')
      .populate({
        path: 'doctorNotes.prescriptions',
        populate: { path: 'doctorID', select: 'firstName lastName' }
      })
      .populate('labRequests');

    if (!medicalRecord) throw new Error('Medical record not found');

    const patient = medicalRecord.patientID;
    const hospital = medicalRecord.hospitalID;

    // Extract raw prescription details
    const prescriptionData = (medicalRecord.doctorNotes?.prescriptions || []).flatMap(prescription =>
      (prescription.medicineList || []).map(med => ({
        medicationName: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      }))
    );

    // Extract lab request results
    const labResults = (medicalRecord.labRequests || []).map(request => ({
      testName: request.testType,
      result: request.results?.testValue || '',
      date: request.results?.completedDate || request.completionDate || new Date(),
    }));

    // Construct the new record to push
    const newRecord = {
      hospitalID: hospital?._id?.toString() || '',
      doctorNotes: {
        diagnosis: medicalRecord.doctorNotes?.diagnosis || '',
        treatmentPlan: medicalRecord.doctorNotes?.treatmentPlan || '',
      },
      prescription: prescriptionData,
      labResults,
    };

    const payload = {
      faydaID: patient.faydaID,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup || null,
      records: [newRecord],
    };

    let responseData;
    const existingPatient = await CenteralPatientHistory.findOne({ faydaID: patient.faydaID });

    if (!existingPatient) {
      // Create a new patient history
      responseData = await CenteralPatientHistory.create(payload);
    } else {
      // Update existing patient history
      existingPatient.records.push(newRecord);
      responseData = await existingPatient.save();
    }

    // Update MedicalRecord to reflect sync status
    await MedicalRecord.findByIdAndUpdate(recordId, {
      syncedToCentral: true,
      lastSyncedAt: new Date(),
    });

    return {
      success: true,
      message: 'Successfully synced to central patient history',
      centralResponse: responseData,
    };
  } catch (error) {
    console.error('Error in syncToCentralPatientHistory:', error);
    return {
      success: false,
      message: error?.response?.data?.error || 'Failed to sync to central patient history',
      error: error.message,
    };
  }
};









const updateMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user?._id;
    const { diagnosis, treatmentPlan, vitals } = req.body;

    // Validate required fields
    if (!diagnosis || !treatmentPlan) {
      return res.status(400).json({ 
        success: false,
        message: "Diagnosis and treatment plan are required" 
      });
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      currentDoctor: doctorId
    });

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: "Record not found or unauthorized" 
      });
    }

    // Update values
    record.doctorNotes.diagnosis = diagnosis;
    record.doctorNotes.treatmentPlan = treatmentPlan;
    record.triageData.vitals = vitals || {};
    record.status = "Completed";
    record.updatedAt = new Date();

    await record.save();

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('patientID', 'faydaID firstName lastName')
      .populate('currentDoctor', 'firstName lastName')
      .populate('doctorNotes.prescriptions')
      .populate('labRequests');

    syncToCentralPatientHistory(populatedRecord);

    res.status(200).json({ 
      success: true,
      message: "Record updated successfully",
      data: populatedRecord
    });
  } catch (error) {
    console.error("Error in updateMedicalRecord:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error updating record" 
    });
  }
};



const createLabRequest = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { testType, instructions, urgency } = req.body;
    const doctorId = req.user?._id;

    if (!recordId || !testType) {
      return res.status(400).json({ 
        success: false,
        message: "Medical record ID and test type are required" 
      });
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      currentDoctor: doctorId,
      status: "InTreatment"
    });

    if (!record) {
      return res.status(403).json({ 
        success: false,
        message: "Medical record not found or not in treatment status" 
      });
    }

    const newRequest = new LabRequest({
      patientID: record.patientID,
      doctorID: doctorId,
      testType,
      instructions,
      urgency: urgency || "Normal",
      status: "Pending"
    });

    await newRequest.save();

    // Push the lab request to the record
    record.labRequests.push(newRequest._id);
    await record.save();

    res.status(201).json({ 
      success: true,
      message: "Lab request created",
      data: newRequest 
    });
  } catch (error) {
    console.error("Error in createLabRequest:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error creating lab request" 
    });
  }
};

/**
 * Get all lab requests for a medical record
 */
const getPatientLabRequests = async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user?._id;

    // Verify medical record belongs to this doctor
    const record = await MedicalRecord.findOne({
      _id: recordId,
    });

    if (!record) {
      return res.status(403).json({ 
        success: false,
        message: "Medical record not found or unauthorized" 
      });
    }

    const requests = await LabRequest.find({ 
      _id: record.labRequests || [], 
    })
    .sort({ requestDate: -1 })
    .populate('doctorID', 'firstName lastName');


    res.status(200).json({ 
      success: true,
      count: requests.length,
      data: requests 
    });
  } catch (error) {
    console.error("Error in getPatientLabRequests:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching lab requests" 
    });
  }
};

// ==================== PRESCRIPTIONS ====================

/**
 * Create new prescription
 */
const createPrescription = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { medicines, instructions } = req.body;
    const doctorId = req.user?._id;

    if (!recordId || !medicines || medicines.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Medical record ID and at least one medicine are required" 
      });
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      currentDoctor: doctorId,
      status: "InTreatment"
    });

    if (!record) {
      return res.status(403).json({ 
        success: false,
        message: "Medical record not found or not in treatment status" 
      });
    }

    const validMedicines = medicines.filter(med => 
      med.name && med.dosage && med.frequency && med.duration
    );

    if (validMedicines.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "All medicines must have name, dosage, frequency and duration" 
      });
    }

    const newPrescription = new Prescription({
      patientID: record.patientID,
      doctorID: doctorId,
      medicineList: validMedicines,
      instructions,
      isFilled: false
    });

    await newPrescription.save();

    // Push the prescription to the record
    record.doctorNotes.prescriptions.push(newPrescription._id);
    await record.save();

    res.status(201).json({ 
      success: true,
      message: "Prescription created",
      data: newPrescription 
    });
  } catch (error) {
    console.error("Error in createPrescription:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error creating prescription" 
    });
  }
};

/**
 * Get all prescriptions for a medical record
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const { recordId } = req.params;
    const doctorId = req.user?._id;

    // Verify medical record belongs to this doctor
    const record = await MedicalRecord.findOne({
      _id: recordId
    });

    if (!record) {
      return res.status(403).json({ 
        success: false,
        message: "Medical record not found or unauthorized" 
      });
    }

    const prescriptions = await Prescription.find({ 
      _id: record.doctorNotes?.prescriptions || [],
       
    })
    .sort({ datePrescribed: -1 })
    .populate('doctorID', 'firstName lastName');

    
    res.status(200).json({ 
      success: true,
      count: prescriptions.length,
      data: prescriptions 
    });
  } catch (error) {
    console.error("Error in getPatientPrescriptions:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error fetching prescriptions" 
    });
  }
};




const getMedicalRecordsByFaydaIdAndHospitalId = async (req, res) => {
  try {
    
    const { faydaID, hospitalID } = req.params;
    

    // Validate input
    if (!faydaID || !hospitalID) {
      return res.status(400).json({
        success: false,
        message: "Both faydaID and hospitalID are required"
      });
    }

    // Find medical records with deep population
    const medicalRecords = await MedicalRecord.find({
      faydaID: faydaID,
      hospitalID: hospitalID
    })
    .populate({
      path: 'patientID',
      select: 'name dob gender' // Only select necessary fields
    })
    .populate({
      path: 'hospitalID',
      select: 'name address' // Only select necessary fields
    })
    .populate({
      path: 'currentDoctor',
      select: 'firstName specialization' // Only select necessary fields
    })
    .populate({
      path: 'triageData.staffID',
      select: 'name role' // Only select necessary fields
    })
    .populate({
      path: 'doctorNotes.prescriptions',
      model: 'Prescription',
      populate: {
        path: 'doctorID',
        select: 'name specialization'
      }
    })
    .populate({
      path: 'labRequests',
      model: 'LabRequest',
      populate: [
        {
          path: 'doctorID',
          select: 'firstName specialization'
        },
        {
          path: 'labTechnicianID',
          select: 'name role'
        }
      ]
    })
    .sort({ createdAt: -1 }); // Sort by most recent first

    if (!medicalRecords || medicalRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No medical records found for the given faydaID and hospitalID"
      });
    }

    // Format the response to include all necessary data
    const formattedRecords = medicalRecords.map(record => {
      return {
        ...record.toObject(),
        labRequests: record.labRequests || [],
        prescriptions: record.doctorNotes?.prescriptions || []
      };
    });

    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords
    });

  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching medical records",
      error: error.message
    });
  }
};

module.exports = {
  // Doctor Profile
  getStaffAccount,
  getMedicalRecordsByFaydaIdAndHospitalId,
  // Patient Management
  getAssignedPatients,
  getPatientProfile,
  startTreatment,
  
  syncToCentralPatientHistory,
  // Medical Records
  getPatientMedicalHistory,
  getMedicalRecord,
  updateMedicalRecord,
  
  // Lab Requests
  createLabRequest,
  getPatientLabRequests,
  
  // Prescriptions
  createPrescription,
  getPatientPrescriptions
};
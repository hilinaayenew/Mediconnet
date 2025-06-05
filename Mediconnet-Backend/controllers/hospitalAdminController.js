const User = require("../models/user");
const Doctor = require("../models/doctor");
const LabTechnician = require("../models/LabTechnician");
const Pharmacist = require("../models/pharmacist");
const Receptionist = require("../models/receptionist");
const Triage = require("../models/triage");
const Patient = require("../models/patient");
const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const Hospital = require("../models/hospital");
const HospitalAdministrator = require("../models/HospitalAdministrator");
const MedicalRecord = require("../models/MedicalRecord");

const addStaffAccount = async (req, res) => {
  try {
    const {
      role,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      password,
      email,
      contactNumber,
      address,
      hospitalID,
    } = req.body;

    const { role: staffRole } = req.user;

    if (!staffRole || staffRole !== "HospitalAdministrator") {
      return res
        .status(400)
        .json({ message: "Only hospital admins can add staff member" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const lowerCaseRole = role.toLowerCase();

    const RoleModels = {
      doctor: Doctor,
      labtechnician: LabTechnician,
      pharmacist: Pharmacist,
      receptionist: Receptionist,
      triage: Triage,
    };

    if (!RoleModels[lowerCaseRole]) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    const existingStaff = await User.findOne({email:email})
    if (existingStaff) {
      return res.status(400).json({ message: "Staff Already Exist." });
    }
    // 🔐 Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const StaffModel = RoleModels[lowerCaseRole];
    const staff = new StaffModel({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      password: hashedPassword, 
      contactNumber,
      address,
      hospitalID,
      role,
      email,
    });

    await staff.save();

    res
      .status(201)
      .json({ message: "Staff account created successfully", staff });
  } catch (error) {
    console.error("Error in addStaffAccount:", error);
    res
      .status(500)
      .json({ message: "Error creating staff account", error: error.message });
  }
};


const getStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find the user with populated hospital data
    const user = await User.findById(id)
      .populate({
        path: 'hospitalID',
        select: 'name location contactNumber licenseNumber licenseImage',
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For Hospital Administrators, get additional hospital info
    let hospitalDetails = null;
    if (user.role === 'HospitalAdministrator') {
      const admin = await HospitalAdministrator.findById(id)
        .populate('hospitalID');
      hospitalDetails = admin?.hospitalID || null;
    }

    // Structure the response data
    const responseData = {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      hospital: hospitalDetails || user.hospitalID
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getStaffDetails:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getHospitalDetails = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "HospitalAdministrator") {
      return res.status(403).json({ msg: "Unauthorized access" });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ msg: "Hospital not found" });
    }

    // Get all staff for this hospital (excluding system Admins)
    const staff = await User.aggregate([
      {
        $match: {
          hospitalID: new mongoose.Types.ObjectId(id),
          role: { $nin: ["Admin"] } // Exclude system admins
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          lastLogin: 1,
          status: 1,
          createdAt: 1,
          dateOfBirth: 1,
          gender: 1,
          profilePicture: 1
        }
      },
      { $sort: { role: 1, createdAt: -1 } }
    ]);

    // Categorize staff by their roles
    const staffByRole = staff.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    // Get counts for each role
    const roleCounts = Object.keys(staffByRole).reduce((acc, role) => {
      acc[role] = staffByRole[role].length;
      return acc;
    }, {});

    res.status(200).json({
      hospital,
      staff,
      staffByRole,
      roleCounts,
      totalStaff: staff.length
    });

  } catch (error) {
    console.error("Get hospital details error:", error);
    res.status(500).json({ msg: "Server error fetching hospital details" });
  }
}


const getStaffAccounts = async (req, res) => {
  try {
    

    const staffs = await User.find({ hospitalID: req.user.hospitalID });

    res.status(200).json(  staffs );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something Went Wrong"});
  }
};
const getStaffAccount = async (req, res) => {
  try {
    const {id}= req.params

    const staffs = await User.findById(id);

    res.status(200).json(  staffs );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something Went Wrong"});
  }
};


const deleteStaffAccount = async (req, res) => {
  try {
    const { role: staffRole } = req.user;

    if (!staffRole || staffRole != "HospitalAdministrator") {
      return res
        .status(400)
        .json({ message: "Only hospital admins can add staff member" });
    }

    const { staffId } = req.params;
    const deletedUser = await User.findByIdAndDelete(staffId);

    if (!deletedUser) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting staff", error: error.message });
  }
};

const viewPatientsByHospital = async (req, res) => {
  try {
    const { role: staffRole } = req.user;

    if (!staffRole || staffRole != "HospitalAdministrator") {
      return res
        .status(400)
        .json({ message: "Only hospital admins can add staff member" });
    }

    const { hospitalID } = req.params;
    const patients = await Patient.find({ hospitalID });

    if (!patients.length) {
      return res
        .status(404)
        .json({ message: "No patients found for this hospital" });
    }

    res.status(200).json({ patients });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching patients", error: error.message });
  }
};


const getMedicalOfPatient = async (req, res) => {
 try {
     
     const { id, hospitalID } = req.params;
     
 
     // Validate input
     if (!id || !hospitalID) {
       return res.status(400).json({
         success: false,
         message: "Both faydaID and hospitalID are required"
       });
     }


 
     const medicalRecords = await MedicalRecord.find({
       patientID: id,
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



const searchPatient = async (req, res) => {
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

const getPatient = async (req, res) => {
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



module.exports = {
  addStaffAccount,
  getStaffAccounts,
  deleteStaffAccount,
  viewPatientsByHospital,
  getStaffAccount,
  getHospitalDetails,
  getStaff,
  getMedicalOfPatient,
  searchPatient,
  getPatient
};

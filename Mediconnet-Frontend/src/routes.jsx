import { Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/Notfound";

// System Admin pages
import AddAdmin from "./pages/admin/AddAdmin";
import AddHospital from "./pages/admin/AddHospital";
import AdminManagement from "./pages/admin/AdminManagement";
import HospitalDetail from "./pages/admin/HospitalDetail";
import HospitalManagement from "./pages/admin/HospitalManagement";
import AdminDashboard from "./pages/admin/Dashboard";

// Hospital Admin pages
import HospitalAdminDashboard from "./pages/hospitalAdmin/Dashboard";
import AddNewStaff from "./pages/hospitalAdmin/AddNewStaff";
import EditViewStaff from "./pages/hospitalAdmin/EditViewStaff";
import PatientRecord from "./pages/hospitalAdmin/PatientRecord";
import RecordAuditLogs from "./pages/hospitalAdmin/RecordAuditLogs";
import StaffManagement from "./pages/hospitalAdmin/StaffManagement";
import ViewRecords from "./pages/hospitalAdmin/ViewRecords";

// Receptionist pages
import ReceptionistDashboard from "./pages/receptionist/Dashboard";

// Doctor pages
import DoctorDashboard from "./pages/Doctor/Dashboard";
import AssignedRecords from "./pages/Doctor/AssignedRecords";
import PatientDetail from "./pages/Doctor/PatientDetail";
import StaffDetail from "./pages/admin/StaffDetail";

import RegisteredPatient from "./pages/receptionist/RegisteredPatient";
import NewRegistration from "./pages/receptionist/NewRegistration";
import PatientRegistration from "./pages/receptionist/PatientRegistration";

import TriageDashboard from "./pages/triage/Dashboard";
import ProcessPatient from "./pages/triage/PatientForm";
import UnassignedPatients from "./pages/triage/UnassignedPatient";
import DashboardLaboratorist from "./pages/labratorist/DashboardLaboratorist";
import LabRequests from "./pages/labratorist/LabRequests";
import LabForm from "./pages/labratorist/LabForm";
import PatientRecordDetail from "./pages/hospitalAdmin/PatientRecordDetail";
import PharmacistPatientList from "./pages/Pharmacist/PharmacistPatientList";
import PharmacistPateintDetail from "./pages/Pharmacist/PharmacistPateintDetail";
import HospitalAdminListOfPatient from "./pages/hospitalAdmin/HospitalAdminListOfPatient";
import { roleRedirects } from "./lib/role";

const AppRoutes = ({ userRole }) => {

 const getDashboardRoute = () => {
    return roleRedirects[userRole] || "/login";
  };

  return (
    <Routes>

      <Route path="/" element={<Navigate to={getDashboardRoute()} />} />

      {/* Admin Routes */}
      {userRole === "Admin" && (
        <>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hospital-management" element={<HospitalManagement />} />
          <Route path="/admin/hospital-management/add-hospital" element={<AddHospital />} />
          <Route path="/admin/hospital-detail/:id" element={<HospitalDetail />} />
          <Route path="/admin/hospital-detail/staff/:id" element={<StaffDetail />} />
          <Route path="/admin/admin-management/:id/add-admin" element={<AddAdmin />} />
          <Route path="/admin/admin-management" element={<AdminManagement />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        </>
      )}


      {userRole === "User" && (
        <>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hospital-management" element={<HospitalManagement />} />
          <Route path="/admin/hospital-management/add-hospital" element={<AddHospital />} />
          <Route path="/admin/hospital-detail/:id" element={<HospitalDetail />} />
          <Route path="/admin/hospital-detail/staff/:id" element={<StaffDetail />} />
          <Route path="/admin/admin-management/:id/add-admin" element={<AddAdmin />} />
          <Route path="/admin/admin-management" element={<AdminManagement />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        </>
      )}
      
      {/* Hospital Admin Routes */}
      {userRole === "HospitalAdministrator" && (
        <>
          <Route path="/hospital-admin/dashboard" element={<HospitalAdminDashboard />} />
          <Route path="/hospital-admin/add-staff" element={<AddNewStaff />} />
          <Route path="/hospital-admin/edit-staff" element={<EditViewStaff />} />
          <Route path="/hospital-admin/patient-records" element={<PatientRecord />} />
          <Route path="/hospital-admin/patient-records-record/:faydaId" element={<PatientRecordDetail />} />
          <Route path="/hospital-admin/audit-logs" element={<RecordAuditLogs />} />
          <Route path="/hospital-admin/staff-management" element={<StaffManagement />} />
          <Route path="/hospital-admin/view-records" element={<ViewRecords />} />
          <Route path="/hospital-admin" element={<Navigate to="/hospital-admin/dashboard" />} />
          <Route path="/hospital-admin/patientList" element={<HospitalAdminListOfPatient />} />
          <Route path="/hospital-admin/auditLog/:patientId" element={<RecordAuditLogs />} />
        </>
      )}

      {/* Receptionist Routes */}
      {userRole === "Receptionist" && (
        <>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/registration" element={<PatientRegistration />} />
          <Route path="/receptionist/registered/:faydaID" element={<RegisteredPatient />} />
          <Route path="/receptionist/newRegistration" element={<NewRegistration />} />
          <Route path="/receptionist" element={<Navigate to="/receptionist/dashboard" />} />
        </>
      )}

      {/* Triage Routes */}
{userRole === "Triage" && (
  <>
    <Route path="/triage/dashboard" element={<TriageDashboard />} />
    <Route path="/triage/process/:id" element={<ProcessPatient />} />
    <Route path="/triage/unassigned" element={<UnassignedPatients />} />
    <Route path="/triage" element={<Navigate to="/triage/dashboard" />} />
  </>
)}

      {/* Doctor Routes */}
      {userRole === "Doctor" && (
        <>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/assigned-records" element={<AssignedRecords />} />
          <Route path="/doctor" element={<Navigate to="/doctor/dashboard" />} />
          <Route path="/doctor/records/:patientId" element={<PatientDetail />} />
        </>
      )}


      {/* Laboratorist Routes */}
      
          {userRole === "LabTechnician" && (
            <>
              <Route path="/laboratorist/dashboard" element={<DashboardLaboratorist />} />
              <Route path="/laboratorist/patientList" element={<LabRequests />} />
              <Route path="/laboratorist" element={<Navigate to="/laboratorist/dashboard" />} />
              <Route path="/laboratorist/requests/:id" element={<LabForm />} />
            </>
          )}
          {userRole === "Pharmacist" && (
            <>
              <Route path="/pharmacist/patientList" element={<PharmacistPatientList />} />
              <Route path="/pharmacist/patientDetail/:id" element={<PharmacistPateintDetail />} />
            </>
          )}





      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

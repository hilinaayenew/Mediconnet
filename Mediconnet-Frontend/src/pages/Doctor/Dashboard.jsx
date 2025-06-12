import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Hospital,
  Calendar,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Cake,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isValid, parseISO } from "date-fns";
import { BASE_URL } from "@/lib/utils";

const DoctorDashboard = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        
        const userRes = await fetch(`${BASE_URL}/auth/me`, {
          credentials: "include",
        });
        if (!userRes.ok) throw new Error("Failed to fetch user info");
        const userData = await userRes.json();

        const doctorRes = await fetch(
          `${BASE_URL}/doctors/getStaffAccount/${userData.userId}`,
          { credentials: "include" }
        );
        if (!doctorRes.ok) throw new Error("Failed to fetch doctor info");
        const doctorData = await doctorRes.json();
        setDoctorData(doctorData);

        if (doctorData.assignedPatientID?.length > 0) {
          const patientPromises = doctorData.assignedPatientID.map(patientId => 
            fetch(`${BASE_URL}/patients/${patientId.$oid}`, {
              credentials: "include"
            }).then(res => {
              if (!res.ok) throw new Error(`Failed to fetch patient ${patientId.$oid}`);
              return res.json();
            })
          );

          const patientsData = await Promise.allSettled(patientPromises);
          const successfulPatients = patientsData
            .filter(result => result.status === "fulfilled")
            .map(result => result.value.data);
          
          setAssignedPatients(successfulPatients);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!doctorData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Failed to load doctor data</p>
      </div>
    );
  }

  const formattedDOB = doctorData.dateOfBirth && isValid(new Date(doctorData.dateOfBirth))
    ? format(new Date(doctorData.dateOfBirth), 'MMMM d, yyyy')
    : "N/A";

  const createdAtDate = doctorData.createdAt && isValid(new Date(doctorData.createdAt))
    ? new Date(doctorData.createdAt)
    : null;

  const yearsOfService = createdAtDate
    ? new Date().getFullYear() - createdAtDate.getFullYear()
    : "N/A";

  const createdAtYear = createdAtDate ? format(createdAtDate, 'yyyy') : "N/A";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" />
            <AvatarFallback>
              {doctorData.firstName?.charAt(0)}
              {doctorData.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Dr. {doctorData.firstName} {doctorData.lastName}
            </h1>
            <p className="text-muted-foreground">{doctorData.specialization}</p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/doctor/assigned-records")}
          className="flex items-center gap-2"
        >
          <Stethoscope className="h-4 w-4" />
          View Assigned Patients
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={<Mail />} label="Email" value={doctorData.email} />
              <InfoRow icon={<Phone />} label="Contact" value={doctorData.contactNumber} />
              <InfoRow icon={<Cake />} label="Date of Birth" value={formattedDOB} />
              <InfoRow icon={<User />} label="Gender" value={doctorData.gender} />
              <InfoRow icon={<MapPin />} label="Address" value={doctorData.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hospital Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctorData.hospital ? (
                <>
                  <InfoRow label="Hospital Name" value={doctorData.hospital.name} />
                  <InfoRow label="Location" value={doctorData.hospital.location} />
                  <InfoRow label="Contact" value={doctorData.hospital.contactNumber} />
                </>
              ) : (
                <p className="text-muted-foreground">Not assigned to any hospital</p>
              )}
            </CardContent>
          </Card>
        </div>

{/*         <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Assigned Patients"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              value={doctorData.assignedPatientID?.length || 0}
              description="Currently under your care"
            />
          
          </div> */}

          

          
        </div>
      </div>
    </div>
  );
};

// Reusable subcomponents
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4">
    {icon && <div className="h-5 w-5 text-muted-foreground">{icon}</div>}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p>{value || "N/A"}</p>
    </div>
  </div>
);

const StatCard = ({ title, icon, value, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default DoctorDashboard;

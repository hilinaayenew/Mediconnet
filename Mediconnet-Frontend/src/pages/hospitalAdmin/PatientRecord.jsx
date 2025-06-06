"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Search, Printer } from "lucide-react"
import { BASE_URL } from "@/lib/utils"
import { toast } from "react-toastify"

const PatientRecords = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${BASE_URL}/central-history/patients?firstName=${searchTerm}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch patients: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setPatients(data.data)
        } else {
          throw new Error(data.message || "No patient data received")
        }
      } catch (error) {
        console.error("Fetch error:", error)
        toast.error(error.message || "Failed to fetch patients")
        setPatients([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchPatients()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleViewPatient = (faydaID) => {
    navigate(`/hospital-admin/patient-records-record/${faydaID}`)
  }

  const handlePrintRecords = () => {
    toast.info("Preparing patient records for printing...")
    // Add your print functionality here
  }

  return (
    <div className="p-6 bg-[#F7F7F9] min-h-screen font-poppins">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16151C]">Patient Records</h1>
        <Button 
          onClick={handlePrintRecords}
          className="flex items-center gap-2 bg-[#5B8FAA] hover:bg-[#4A7A8C] text-white font-poppins transition-colors duration-200"
        >
          <Printer className="w-4 h-4" />
          Print Records
        </Button>
      </div>

      <div className="relative w-full mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A2A1A8]" size={18} />
        <Input
          placeholder="Search by patient name..."
          className="pl-10 text-[#16151C] border-[#5B8FAA] focus:ring-[#5B8FAA] focus:border-[#5B8FAA]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5B8FAA]"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#A2A1A8] text-base">No patients found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 bg-[#F7F7F9] p-4 font-medium text-[#A2A1A8]">
            <div className="col-span-2">Fayda ID</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Date of Birth</div>
            <div className="col-span-2">Gender</div>
            <div className="col-span-2"></div>
            <div className="col-span-1">Actions</div>
          </div>
          {patients.map((patient) => (
            <div key={patient.faydaID} className="grid grid-cols-12 p-4 border-b items-center hover:bg-[#F7F7F9] transition-colors duration-100">
              <div className="col-span-2 font-mono text-[#16151C]">{patient.faydaID}</div>
              <div className="col-span-3 text-[#16151C]">{patient.firstName} {patient.lastName}</div>
              <div className="col-span-2 text-[#16151C]">
                {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
              </div>
              <div className="col-span-2 text-[#16151C]">{patient.gender || 'N/A'}</div>
              <div className="col-span-2 text-[#16151C]"></div>
              <div className="col-span-1">
                <Button
                  size="sm"
                  onClick={() => handleViewPatient(patient.faydaID)}
                  className="bg-[#5B8FAA] hover:bg-[#4A7A8C] text-white font-poppins transition-colors duration-200"
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientRecords
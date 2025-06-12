"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, ArrowLeft, Pill, Calendar, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { BASE_URL } from "@/lib/utils"

const PharmacistPatientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [searchDate, setSearchDate] = useState("")
  const [loading, setLoading] = useState({
    patient: true,
    prescriptions: true
  })
  const [error, setError] = useState({
    patient: null,
    prescriptions: null
  })

  const fetchPatient = async () => {
    try {
      setLoading(prev => ({ ...prev, patient: true }))
      setError(prev => ({ ...prev, patient: null }))
      const response = await axios.get(`${BASE_URL}/pharmacist/patients/${id}`, {
        withCredentials: true
      })
      setPatient(response.data)
    } catch (err) {
      console.error("Failed to fetch patient:", err)
      setError(prev => ({ ...prev, patient: "Failed to load patient details" }))
    } finally {
      setLoading(prev => ({ ...prev, patient: false }))
    }
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(prev => ({ ...prev, prescriptions: true }))
      setError(prev => ({ ...prev, prescriptions: null }))
      const response = await axios.get(`${BASE_URL}/pharmacist/prescriptions/${id}`, {
        params: { searchDate },
        withCredentials: true
      })
      setPrescriptions(response.data)
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err)
      setError(prev => ({ ...prev, prescriptions: "Failed to load prescriptions" }))
    } finally {
      setLoading(prev => ({ ...prev, prescriptions: false }))
    }
  }

  useEffect(() => {
    fetchPatient()
    fetchPrescriptions()
  }, [id])

  useEffect(() => {
    if (!loading.patient) {
      fetchPrescriptions()
    }
  }, [searchDate])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error.patient) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto max-w-md bg-background rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-destructive mb-4">{error.patient}</h2>
          <Button 
            variant="outline" 
            onClick={fetchPatient}
            className="mt-2"
          >
            Retry Loading Patient
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/pharmacist/patientList')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patient List
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Patient Prescriptions</h1>
          {!loading.patient && patient && (
            <p className="text-sm text-muted-foreground">
              Managing prescriptions for {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-40"
          />
          <Button 
            variant="outline"
            onClick={() => setSearchDate("")}
            disabled={!searchDate}
          >
            Clear Date
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg border shadow-sm p-4">
        {loading.patient ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
              ))}
            </div>
          </div>
        ) : patient && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary font-medium text-2xl">
                {patient.firstName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {patient.firstName} {patient.lastName}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    
                    {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                  </span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {patient.faydaID}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Prescriptions</h3>
          
          {error.prescriptions ? (
            <div className="text-center py-8 bg-red-50/50 rounded-lg">
              <p className="text-destructive mb-4">{error.prescriptions}</p>
              <Button variant="outline" onClick={fetchPrescriptions}>
                Retry Loading Prescriptions
              </Button>
            </div>
          ) : loading.prescriptions ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">
                        Prescribed by Dr. {prescription.doctorID.firstName} {prescription.doctorID.lastName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(prescription.datePrescribed)}</span>
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(prescription.datePrescribed)}</span>
                      
                    </div>
                  </div>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescription.medicineList.map((medicine, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{medicine.name}</TableCell>
                            <TableCell>{medicine.dosage}</TableCell>
                            <TableCell>{medicine.frequency}</TableCell>
                            <TableCell>{medicine.duration}</TableCell>
                            
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Pill className="h-10 w-10 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">
                {searchDate 
                  ? "No prescriptions found for the selected date" 
                  : "No prescriptions found for this patient"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PharmacistPatientDetail

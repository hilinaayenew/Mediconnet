"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import { toast } from "react-toastify"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable" // Correct import
import { BASE_URL } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const PatientRecordDetail = () => {
  const { faydaId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${BASE_URL}/central-history/records/${faydaId}`)
        
        if (!response.ok) throw new Error(`Failed to fetch patient: ${response.status}`)

        const data = await response.json()
        if (data.success) {
          setPatient(data.patient)
        } else {
          throw new Error(data.message || "Patient not found")
        }
      } catch (error) {
        toast.error(error.message)
        navigate("/hospital-admin/patient-records")
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [faydaId, navigate])

  const generateRecordPDF = (record) => {
    try {
      if (!record || !patient) throw new Error("No record data available")

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

      // Apply the autoTable plugin to the jsPDF instance
      autoTable(doc, {});

      // Margins and constants
      const marginLeft = 15
      const marginRight = 15
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm

      // Watermark
      doc.setFontSize(40)
      doc.setTextColor(200, 200, 200) // Light gray for watermark
      doc.setFont("poppins", "bold")
      doc.text("Ministry of Health", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45,
        opacity: 0.2
      })

      // Header
      doc.setFontSize(18)
      doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
      doc.setFont("poppins", "bold")
      doc.text("Ministry of Health - Patient Medical Record", pageWidth / 2, 20, { align: "center" })
      
      doc.setFontSize(10)
      doc.setTextColor(162, 161, 168) // textgray: #A2A1A8
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 27, { align: "center" })
      
      // Horizontal line
      doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
      doc.setLineWidth(0.5)
      doc.line(marginLeft, 30, pageWidth - marginRight, 30)

      // Patient Information
      doc.setFontSize(12)
      doc.setTextColor(22, 21, 28) // textblack: #16151C
      doc.setFont("poppins", "bold")
      doc.text("Patient Information", marginLeft, 40)
      
      doc.setFont("poppins", "normal")
      doc.text(`Name: ${patient.fullName}`, marginLeft, 48)
      doc.text(`Fayda ID: ${patient.faydaID}`, marginLeft, 54)
      doc.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, marginLeft, 60)
      doc.text(`Gender: ${patient.gender}`, marginLeft, 66)
      doc.text(`Contact: ${patient.contactNumber || 'N/A'}`, marginLeft, 72)
      doc.text(`Address: ${patient.address || 'N/A'}`, marginLeft, 78)

      // Medical History Section
      let yPos = 88
      doc.setFontSize(12)
      doc.setFont("poppins", "bold")
      doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
      doc.text("Medical History", marginLeft, yPos)
      doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
      doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)

      yPos += 8
      doc.setFont("poppins", "normal")
      doc.setTextColor(22, 21, 28) // textblack: #16151C
      const medicalHistory = record.medicalHistory || "No medical history provided"
      const splitHistory = doc.splitTextToSize(medicalHistory, pageWidth - marginLeft - marginRight)
      doc.text(splitHistory, marginLeft, yPos)
      yPos += splitHistory.length * 5 + 10

      // Allergies Section
      doc.setFont("poppins", "bold")
      doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
      doc.text("Allergies", marginLeft, yPos)
      doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
      doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)

      yPos += 8
      doc.setFont("poppins", "normal")
      doc.setTextColor(22, 21, 28) // textblack: #16151C
      const allergies = record.allergies || "No allergies reported"
      const splitAllergies = doc.splitTextToSize(allergies, pageWidth - marginLeft - marginRight)
      doc.text(splitAllergies, marginLeft, yPos)
      yPos += splitAllergies.length * 5 + 10

      // Doctor's Notes Section
      doc.setFont("poppins", "bold")
      doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
      doc.text("Doctor's Assessment", marginLeft, yPos)
      doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
      doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)

      if (record.doctorNotes) {
        yPos += 8
        doc.setFont("poppins", "bold")
        doc.setTextColor(22, 21, 28) // textblack: #16151C
        doc.text("Diagnosis:", marginLeft, yPos)
        
        doc.setFont("poppins", "normal")
        doc.setTextColor(22, 21, 28) // textblack: #16151C
        const diagnosis = record.doctorNotes.diagnosis || "No diagnosis provided"
        const splitDiagnosis = doc.splitTextToSize(diagnosis, pageWidth - marginLeft - marginRight)
        doc.text(splitDiagnosis, marginLeft + 5, yPos + 5)
        yPos += splitDiagnosis.length * 5 + 8
        
        if (record.doctorNotes.treatmentPlan) {
          doc.setFont("poppins", "bold")
          doc.setTextColor(22, 21, 28) // textblack: #16151C
          doc.text("Treatment Plan:", marginLeft, yPos)
          
          doc.setFont("poppins", "normal")
          doc.setTextColor(22, 21, 28) // textblack: #16151C
          const splitPlan = doc.splitTextToSize(record.doctorNotes.treatmentPlan, pageWidth - marginLeft - marginRight)
          doc.text(splitPlan, marginLeft + 5, yPos + 5)
          yPos += splitPlan.length * 5 + 10
        }
      } else {
        yPos += 8
        doc.setFont("poppins", "normal")
        doc.setTextColor(22, 21, 28) // textblack: #16151C
        doc.text("No doctor's notes available", marginLeft, yPos)
        yPos += 10
      }

      // Prescriptions Section
      if (record.prescription?.length > 0) {
        doc.setFontSize(12)
        doc.setFont("poppins", "bold")
        doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
        doc.text("Prescribed Medications", marginLeft, yPos)
        doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
        doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)

        const prescriptionData = record.prescription.map(med => [
          med.medicationName,
          med.dosage || 'N/A',
          med.frequency || 'N/A',
          med.duration || 'N/A'
        ])
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
          body: prescriptionData,
          headStyles: {
            fillColor: [91, 143, 170], // brand color: #5B8FAA
            textColor: 255,
            fontStyle: 'bold',
            font: 'poppins'
          },
          styles: {
            fontSize: 10,
            cellPadding: 3,
            font: 'poppins',
            textColor: [22, 21, 28] // textblack: #16151C
          }
        })
        yPos = doc.lastAutoTable.finalY + 10
      }

      // Lab Results Section
      if (record.labResults?.length > 0) {
        doc.setFontSize(12)
        doc.setFont("poppins", "bold")
        doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
        doc.text("Laboratory Results", marginLeft, yPos)
        doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
        doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)

        const labData = record.labResults.map(result => [
          result.testName || 'N/A',
          result.result || 'N/A',
          result.referenceRange || 'N/A',
          result.date ? new Date(result.date).toLocaleDateString() : 'N/A'
        ])

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Test Name', 'Result', 'Reference Range', 'Date']],
          body: labData,
          headStyles: {
            fillColor: [91, 143, 170], // brand color: #5B8FAA
            textColor: 255,
            fontStyle: 'bold',
            font: 'poppins'
          },
          styles: {
            fontSize: 10,
            cellPadding: 3,
            font: 'poppins',
            textColor: [22, 21, 28] // textblack: #16151C
          }
        })
        yPos = doc.lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(12)
        doc.setFont("poppins", "bold")
        doc.setTextColor(91, 143, 170) // brand color: #5B8FAA
        doc.text("Laboratory Results", marginLeft, yPos)
        doc.setDrawColor(91, 143, 170) // brand color: #5B8FAA
        doc.line(marginLeft, yPos + 2, pageWidth - marginRight, yPos + 2)
        yPos += 8
        doc.setFont("poppins", "normal")
        doc.setTextColor(22, 21, 28) // textblack: #16151C
        doc.text("No laboratory results available", marginLeft, yPos)
        yPos += 10
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(162, 161, 168) // textgray: #A2A1A8
      doc.setFont("poppins", "normal")
      doc.text("Confidential: Official Document - Ministry of Health", marginLeft, pageHeight - 10)
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - marginRight, pageHeight - 10, { align: "right" })

      doc.save(`Medical_Record_${patient.faydaID}_${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success("Medical record exported successfully")
    } catch (error) {
      toast.error(error.message || "Failed to generate PDF")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-poppins font-bold text-error">Patient Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/hospital-admin/patient-records")} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-poppins transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient Records
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 min-h-screen space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 font-poppins"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-navheader font-bold text-textblack">Patient Medical Records</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-textblack">Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-base text-textgray">Fayda ID</p>
              <p className="font-medium text-textblack">{patient.faydaID}</p>
            </div>
            <div>
              <p className="text-base text-textgray">Full Name</p>
              <p className="font-medium text-textblack">{patient.fullName}</p>
            </div>
            <div>
              <p className="text-base text-textgray">Date of Birth</p>
              <p className="font-medium text-textblack">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-base text-textgray">Gender</p>
              <p className="font-medium text-textblack">{patient.gender}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-poppins text-xl text-textblack">Medical Records</CardTitle>
            {patient.records.length > 0 && (
              <p className="text-base text-textgray">
                {patient.records.length} record(s) found
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {patient.records.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-base text-textgray">No medical records found for this patient</p>
            </div>
          ) : (
            <div className="space-y-6">
              {patient.records.map((record, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-white">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-poppins text-textblack">Record #{index + 1}</CardTitle>
                      <Button 
                        size="sm" 
                        onClick={() => generateRecordPDF(record)}
                        className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white font-poppins transition-colors duration-200"
                      >
                        <Printer className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {record.doctorNotes && (
                      <div className="mb-6">
                        <h4 className="font-medium mb-2 text-accent font-poppins">Doctor's Notes</h4>
                        <div className="space-y-3">
                          {record.doctorNotes.diagnosis && (
                            <div>
                              <p className="text-base text-textgray">Diagnosis</p>
                              <p className="whitespace-pre-wrap text-textblack">{record.doctorNotes.diagnosis}</p>
                            </div>
                          )}
                          {record.doctorNotes.treatmentPlan && (
                            <div>
                              <p className="text-base text-textgray">Treatment Plan</p>
                              <p className="whitespace-pre-wrap text-textblack">{record.doctorNotes.treatmentPlan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {record.prescription?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium mb-2 text-success font-poppins">Prescriptions</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-tableHeader">
                              <tr>
                                <th className="px-4 py-3 text-left text-base font-medium text-textgray uppercase tracking-wider">Medication</th>
                                <th className="px-4 py-3 text-left text-base font-medium text-textgray uppercase tracking-wider">Dosage</th>
                                <th className="px-4 py-3 text-left text-base font-medium text-textgray uppercase tracking-wider">Frequency</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border">
                              {record.prescription.map((med, i) => (
                                <tr key={i} className="hover:bg-plight transition-colors duration-100">
                                  <td className="px-4 py-3 whitespace-nowrap text-base text-textblack">{med.medicationName}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-base text-textblack">{med.dosage || 'N/A'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-base text-textblack">{med.frequency || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientRecordDetail
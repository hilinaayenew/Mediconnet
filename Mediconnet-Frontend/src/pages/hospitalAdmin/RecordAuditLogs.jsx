import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import { Hospital, UserCheck, FlaskConical, Pill, Loader2 } from 'lucide-react';
import { BASE_URL, safeFormat } from '@/lib/utils';
import { toast } from "react-toastify";
const RecordAuditLogs = () => {
  const [hospitalRecords, setHospitalRecords] = useState([]);
  const [isLoadingHospitalRecords, setIsLoadingHospitalRecords] = useState(false);
  const { patientId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data to get hospitalId
        const userRes = await fetch(`${BASE_URL}/auth/me`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!userRes.ok) {
          throw new Error('Failed to fetch user info');
        }

        const usersData = await userRes.json();
        const hospitalId = usersData.hospitalId;

        if (patientId && hospitalId) {
          await fetchHospitalRecords(patientId, hospitalId);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
      }
    };

    fetchData();
  }, [patientId]);

  const fetchHospitalRecords = async (id, hospitalID) => {
    if (!id || !hospitalID) {
      toast.error('Missing patient ID or hospital ID');
      return;
    }

    try {
      setIsLoadingHospitalRecords(true);
      const response = await fetch(
        `${BASE_URL}/hospital-admin/fayda/${id}/hospital/${hospitalID}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch hospital records');
      }

      const data = await response.json();
      setHospitalRecords(data.data || []);
    } catch (error) {
      console.error('Error fetching hospital records:', error);
      toast.error(error.message);
    } finally {
      setIsLoadingHospitalRecords(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Hospital className="h-5 w-5 text-blue-600" />
            Hospital-Specific Medical Records
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Medical records for patient ID: {patientId}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingHospitalRecords ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : hospitalRecords.length > 0 ? (
            <div className="space-y-6">
              {hospitalRecords.map((record, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow border border-gray-100">
                  <CardHeader className="flex flex-row justify-between items-start pb-3 border-b">
                    <div>
                     
                      <p className="text-xs text-gray-500 mt-1">Record ID: {record._id}</p>
                    </div>
                    <Badge
                      variant={
                        record.status === 'Completed'
                          ? 'default'
                          : record.status === 'InTreatment'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {record.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    {record.doctorNotes && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                          <UserCheck className="h-4 w-4" />
                          Doctor's Notes
                        </h3>
                        {record.doctorNotes.diagnosis && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
                            <p className="text-sm text-gray-800">{record.doctorNotes.diagnosis}</p>
                          </div>
                        )}
                        {record.doctorNotes.treatmentPlan && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Treatment Plan</p>
                            <p className="text-sm text-gray-800">{record.doctorNotes.treatmentPlan}</p>
                          </div>
                        )}
                        {record.currentDoctor && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Assigned Doctor</p>
                            <p className="text-sm text-gray-800">
                              Dr. {record.currentDoctor.firstName} ({record.currentDoctor.specialization})
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {record.labRequests && record.labRequests.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h3 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                          <FlaskConical className="h-4 w-4" />
                          Lab Requests ({record.labRequests.length})
                        </h3>
                        <div className="space-y-3">
                          {record.labRequests.map((lab, idx) => (
                            <div
                              key={idx}
                              className="border-b border-green-100 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-800">{lab.testType}</p>
                                <Badge
                                  variant={
                                    lab.status === 'Completed'
                                      ? 'default'
                                      : lab.status === 'In Progress'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {lab.status}
                                </Badge>
                              </div>
                             
                              {lab.results && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500">Results:</p>
                                  {typeof lab.results === 'string' ? (
                                    <p className="text-sm text-gray-800">{lab.results}</p>
                                  ) : (
                                    <div className="text-sm text-gray-800 space-y-1 mt-1">
                                      {Object.entries(lab.results).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span>{key}:</span>
                                          <span className="font-medium">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                          <Pill className="h-4 w-4" />
                          Prescriptions ({record.prescriptions.length})
                        </h3>
                        <div className="space-y-3">
                          {record.prescriptions.map((prescription, idx) => (
                            <div
                              key={idx}
                              className="border-b border-purple-100 pb-3 last:border-0 last:pb-0"
                            >
                              
                              <div className="mt-2 space-y-2">
                                {prescription.medicineList.map((med, medIdx) => (
                                  <div key={medIdx} className="text-sm text-gray-800">
                                    <p className="font-medium">{med.name}</p>
                                    <p className="text-xs text-gray-600">
                                      {med.dosage} • {med.frequency} • {med.duration}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {prescription.instructions && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500">Instructions:</p>
                                  <p className="text-sm text-gray-800">{prescription.instructions}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <Hospital className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-500">
                No hospital-specific medical records found
              </p>
              <Button
                variant="outline"
                onClick={() => fetchHospitalRecords(patientId, hospitalRecords.hospitalId)}
                disabled={isLoadingHospitalRecords}
              >
                {isLoadingHospitalRecords ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  'Retry'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordAuditLogs;
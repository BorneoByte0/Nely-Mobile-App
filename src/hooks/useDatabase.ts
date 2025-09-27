import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ElderlyProfile, VitalSigns, Medication, User, FamilyMember, Appointment, CareNote } from '../types';

// Hook for fetching user's family elderly profiles
export const useElderlyProfiles = () => {
  const [elderlyProfiles, setElderlyProfiles] = useState<ElderlyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { user } = useAuth();

  const fetchElderlyProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('elderly_profiles')
        .select('*')
        .order('date_created', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        // Transform database data to match frontend types
        const profiles: ElderlyProfile[] = data.map(profile => ({
          id: profile.id,
          name: profile.name,
          age: profile.age,
          relationship: profile.relationship,
          avatar: profile.avatar || undefined,
          careLevel: profile.care_level,
          conditions: profile.conditions,
          currentMedications: [], // Will be populated separately
          emergencyContact: profile.emergency_contact || '',
          dateCreated: profile.date_created,
          // Physical information
          weight: profile.weight || undefined,
          height: profile.height || undefined,
          bloodType: profile.blood_type || undefined,
          // Contact & emergency
          doctorName: profile.doctor_name || undefined,
          clinicName: profile.clinic_name || undefined,
          emergencyContactPhone: profile.emergency_contact_phone || undefined,
        }));
        setElderlyProfiles(profiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchElderlyProfiles();
  }, [user, refetchTrigger]);

  const refetch = () => {
    console.log('🔄 Refetching elderly profiles...');
    setRefetchTrigger(prev => prev + 1);
  };

  return { elderlyProfiles, loading, error, refetch };
};

// Hook for fetching latest vital signs for an elderly person
export const useVitalSigns = (elderlyId: string) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { user } = useAuth();

  const fetchVitalSigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('elderly_id', elderlyId)
        .order('recorded_at', { ascending: false })
        .limit(1);

      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        const vital = data[0];
        // Transform database data to match frontend types
        // Helper function to calculate vital sign status
        const calculateBloodPressureStatus = (systolic: number, diastolic: number) => {
          if (systolic === 0 || diastolic === 0) return 'normal'; // No reading yet
          if (systolic >= 180 || diastolic >= 110) return 'critical';
          if (systolic >= 140 || diastolic >= 90) return 'concerning';
          if (systolic < 90 || diastolic < 60) return 'concerning';
          return 'normal';
        };

        const calculateSpO2Status = (value: number) => {
          if (value === 0) return 'normal'; // No reading yet
          if (value < 90) return 'critical';
          if (value < 95) return 'concerning';
          return 'normal';
        };

        const calculatePulseStatus = (value: number) => {
          if (value === 0) return 'normal'; // No reading yet
          if (value < 50 || value > 120) return 'critical';
          if (value < 60 || value > 100) return 'concerning';
          return 'normal';
        };

        const calculateBloodGlucoseStatus = (value: number, testType: string) => {
          if (value === 0) return 'normal'; // No reading yet
          if (testType === 'fasting') {
            if (value < 3.9 || value > 10.0) return 'critical';
            if (value > 7.0) return 'concerning';
          } else {
            if (value < 3.9 || value > 15.0) return 'critical';
            if (value > 11.1) return 'concerning';
          }
          return 'normal';
        };

        const calculateTemperatureStatus = (value: number) => {
          if (value === 0 || value === 36.5) return 'normal'; // No reading yet or default value
          if (value >= 39.5 || value <= 35.0) return 'critical'; // High fever or severe hypothermia
          if (value >= 38.0 || value <= 35.5) return 'concerning'; // Fever or mild hypothermia
          return 'normal';
        };

        const systolic = vital.systolic || 0;
        const diastolic = vital.diastolic || 0;
        const spo2 = vital.spo2 || 0;
        const pulse = vital.pulse || 0;
        const bloodGlucose = vital.blood_glucose || 0;
        const temperature = vital.temperature || 36.5;

        const vitalSigns: VitalSigns = {
          id: vital.id,
          elderlyId: vital.elderly_id,
          bloodPressure: {
            systolic,
            diastolic,
            status: calculateBloodPressureStatus(systolic, diastolic),
          },
          spO2: {
            value: spo2,
            status: calculateSpO2Status(spo2),
          },
          pulse: {
            value: pulse,
            status: calculatePulseStatus(pulse),
          },
          respiratoryRate: {
            value: 18, // Default value
            status: 'normal',
          },
          temperature: {
            value: temperature,
            status: calculateTemperatureStatus(temperature),
          },
          weight: vital.weight ? {
            value: vital.weight,
            unit: 'kg',
            status: 'normal',
          } : undefined,
          bloodGlucose: vital.blood_glucose ? {
            value: bloodGlucose,
            unit: 'mmol/L',
            status: calculateBloodGlucoseStatus(bloodGlucose, vital.blood_glucose_type || 'random'),
            testType: vital.blood_glucose_type || 'random',
          } : undefined,
          lastRecorded: vital.recorded_at,
          recordedBy: vital.recorded_by,
          notes: vital.notes || undefined,
        };
        setVitalSigns(vitalSigns);
      } else {
        setVitalSigns(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!elderlyId) return;
    fetchVitalSigns();
  }, [elderlyId, user, refetchTrigger]);

  const refetch = () => {
    console.log('🔄 Refetching vital signs...');
    setRefetchTrigger(prev => prev + 1);
  };

  return { vitalSigns, loading, error, refetch };
};

// Hook for fetching current user profile
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          // Transform database data to match frontend types
          const profile: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            role: data.role,
            familyId: data.family_id || '',
            avatar: data.avatar || undefined,
            isActive: data.is_active,
            preferredLanguage: data.preferred_language,
            dateJoined: data.date_joined,
          };
          setUserProfile(profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return { userProfile, loading, error };
};

// Hook for recording vital signs
export const useRecordVitalSigns = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordVitalSigns = async (elderlyId: string, vitalData: any, recordedBy: string) => {
    try {
      console.log('🏥 useRecordVitalSigns: Starting...');
      console.log('📥 Received params:', { elderlyId, vitalData, recordedBy });

      setLoading(true);
      setError(null);

      const insertData = {
        elderly_id: elderlyId,
        systolic: vitalData.bloodPressure?.systolic,
        diastolic: vitalData.bloodPressure?.diastolic,
        spo2: vitalData.spO2?.value,
        pulse: vitalData.pulse?.value,
        temperature: vitalData.temperature?.value,
        weight: vitalData.weight?.value,
        blood_glucose: vitalData.bloodGlucose?.value,
        blood_glucose_type: vitalData.bloodGlucose?.testType,
        recorded_by: recordedBy,
        notes: vitalData.notes,
      };

      console.log('💾 Insert data:', insertData);

      const { error: insertError } = await supabase
        .from('vital_signs')
        .insert(insertData);

      if (insertError) {
        console.log('❌ Insert error:', insertError);
        setError(insertError.message);
        return false;
      }

      console.log('✅ Vital signs insert successful!');

      // If there are notes, also create a care note
      if (vitalData.notes && vitalData.notes.trim()) {
        console.log('📝 Creating care note for vital signs...');

        // Get the current user ID for author_id
        const { data: { user } } = await supabase.auth.getUser();
        const authorId = user?.id || 'unknown';

        console.log('👤 Using author ID for care note:', authorId);

        const { error: careNoteError } = await supabase
          .from('care_notes')
          .insert({
            elderly_id: elderlyId,
            author_id: authorId, // Use actual user UUID
            author_name: recordedBy,
            content: `Vital Signs Note: ${vitalData.notes.trim()}`,
            category: 'health',
            is_important: false,
          });

        if (careNoteError) {
          console.log('⚠️ Care note creation failed:', careNoteError);
          // Don't fail the whole operation if care note creation fails
        } else {
          console.log('✅ Care note created successfully!');
        }
      }

      return true;
    } catch (err) {
      console.log('🚨 Catch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { recordVitalSigns, loading, error };
};

// Hook for fetching medications for an elderly person
export const useMedications = (elderlyId: string) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('elderly_id', elderlyId)
        .order('name', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        const meds: Medication[] = data.map(med => ({
          id: med.id,
          elderlyId: med.elderly_id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: med.instructions || '',
          prescribedBy: med.prescribed_by || '',
          startDate: med.start_date,
          endDate: med.end_date || undefined,
          isActive: med.is_active,
        }));
        setMedications(meds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!elderlyId) return;
    fetchMedications();
  }, [elderlyId, refetchTrigger]);

  const refetch = () => {
    console.log('🔄 Refetching medications...');
    setRefetchTrigger(prev => prev + 1);
  };

  return { medications, loading, error, refetch };
};

// Hook for adding medication
export const useAddMedication = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedication = async (medicationData: Omit<Medication, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('medications')
        .insert({
          elderly_id: medicationData.elderlyId,
          name: medicationData.name,
          dosage: medicationData.dosage,
          frequency: medicationData.frequency,
          instructions: medicationData.instructions,
          prescribed_by: medicationData.prescribedBy,
          start_date: medicationData.startDate,
          end_date: medicationData.endDate,
          is_active: true,
        });

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addMedication, loading, error };
};

// Hook for updating medication
export const useUpdateMedication = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMedication = async (medicationId: string, updates: Partial<Medication>) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.dosage) updateData.dosage = updates.dosage;
      if (updates.frequency) updateData.frequency = updates.frequency;
      if (updates.instructions) updateData.instructions = updates.instructions;
      if (updates.prescribedBy) updateData.prescribed_by = updates.prescribedBy;
      if (updates.startDate) updateData.start_date = updates.startDate;
      if (updates.endDate) updateData.end_date = updates.endDate;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error: updateError } = await supabase
        .from('medications')
        .update(updateData)
        .eq('id', medicationId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateMedication, loading, error };
};

// Hook for recording medication taken
export const useRecordMedicationTaken = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordMedicationTaken = async (elderlyId: string, medicationId: string, takenBy: string, notes?: string, dosageTaken?: string) => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const nowIso = now.toISOString();
      const scheduledTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      const { error: upsertError } = await supabase
        .from('medication_schedules')
        .upsert({
          elderly_id: elderlyId,
          medication_id: medicationId,
          date: today,
          scheduled_time: scheduledTime,
          taken: true,
          taken_at: nowIso,
          taken_by: takenBy,
          notes: notes || null,
          dosage_taken: dosageTaken || null,
        }, {
          onConflict: 'elderly_id,medication_id,date,scheduled_time'
        });

      if (upsertError) {
        setError(upsertError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { recordMedicationTaken, loading, error };
};

// Hook for fetching appointments for an elderly person
export const useAppointments = (elderlyId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elderlyId) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('elderly_id', elderlyId)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) {
          setError(error.message);
        } else {
          const appts: Appointment[] = data.map(appt => ({
            id: appt.id,
            elderlyId: appt.elderly_id,
            doctorName: appt.doctor_name,
            clinic: appt.clinic,
            appointmentType: appt.appointment_type,
            date: appt.date,
            time: appt.time,
            status: appt.status,
            notes: appt.notes || undefined,
            followUpRequired: appt.follow_up_required || false,
          }));
          setAppointments(appts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [elderlyId]);

  return { appointments, loading, error };
};

// Hook for fetching upcoming appointments
export const useUpcomingAppointments = (elderlyId: string, limit = 5) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elderlyId) return;

    const fetchUpcomingAppointments = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('elderly_id', elderlyId)
          .eq('status', 'upcoming')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(limit);

        if (error) {
          setError(error.message);
        } else {
          const appts: Appointment[] = data.map(appt => ({
            id: appt.id,
            elderlyId: appt.elderly_id,
            doctorName: appt.doctor_name,
            clinic: appt.clinic,
            appointmentType: appt.appointment_type,
            date: appt.date,
            time: appt.time,
            status: appt.status,
            notes: appt.notes || undefined,
            followUpRequired: appt.follow_up_required || false,
          }));
          setAppointments(appts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, [elderlyId, limit]);

  return { appointments, loading, error };
};

// Hook for adding appointment
export const useAddAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          elderly_id: appointmentData.elderlyId,
          doctor_name: appointmentData.doctorName,
          clinic: appointmentData.clinic,
          appointment_type: appointmentData.appointmentType,
          date: appointmentData.date,
          time: appointmentData.time,
          status: appointmentData.status,
          notes: appointmentData.notes,
          follow_up_required: appointmentData.followUpRequired,
        });

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addAppointment, loading, error };
};

// Hook for updating appointment
export const useUpdateAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};
      if (updates.doctorName) updateData.doctor_name = updates.doctorName;
      if (updates.clinic) updateData.clinic = updates.clinic;
      if (updates.appointmentType) updateData.appointment_type = updates.appointmentType;
      if (updates.date) updateData.date = updates.date;
      if (updates.time) updateData.time = updates.time;
      if (updates.status) updateData.status = updates.status;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.followUpRequired !== undefined) updateData.follow_up_required = updates.followUpRequired;

      const { error: updateError } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateAppointment, loading, error };
};

// Hook for fetching care notes for an elderly person
export const useCareNotes = (elderlyId: string) => {
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchCareNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching care notes for elderly ID:', elderlyId);

      const { data, error } = await supabase
        .from('care_notes')
        .select('*')
        .eq('elderly_id', elderlyId)
        .order('date_created', { ascending: false });

      console.log('🗂️ Care notes query result:', { data, error });

      if (error) {
        console.log('❌ Care notes fetch error:', error);
        setError(error.message);
      } else {
        const notes: CareNote[] = data.map(note => ({
          id: note.id,
          elderlyId: note.elderly_id,
          authorId: note.author_id,
          authorName: note.author_name,
          content: note.content,
          category: note.category,
          dateCreated: note.date_created,
          isImportant: note.is_important || false,
        }));
        console.log('✅ Processed care notes:', notes);
        setCareNotes(notes);
      }
    } catch (err) {
      console.log('🚨 Care notes fetch exception:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!elderlyId) {
      console.log('⚠️ No elderly ID provided for care notes');
      return;
    }
    fetchCareNotes();
  }, [elderlyId, refetchTrigger]);

  const refetch = () => {
    console.log('🔄 Refetching care notes...');
    setRefetchTrigger(prev => prev + 1);
  };

  return { careNotes, loading, error, refetch };
};

// Hook for adding care note
export const useAddCareNote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCareNote = async (noteData: Omit<CareNote, 'id' | 'dateCreated'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('care_notes')
        .insert({
          elderly_id: noteData.elderlyId,
          author_id: noteData.authorId,
          author_name: noteData.authorName,
          content: noteData.content,
          category: noteData.category,
          is_important: noteData.isImportant,
        });

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addCareNote, loading, error };
};

// Hook for creating family group
export const useCreateFamilyGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamilyGroup = async (familyName: string, createdBy: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('family_groups')
        .insert({
          family_name: familyName,
          created_by: createdBy,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      return {
        id: data.id,
        familyCode: data.family_code,
        familyName: data.family_name,
        createdBy: data.created_by,
        createdAt: data.created_at,
        isActive: data.is_active,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createFamilyGroup, loading, error };
};

// Hook for joining family group
export const useJoinFamilyGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinFamilyGroup = async (familyCode: string, userId: string, userName: string, relationship: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, find the family group by code
      const { data: familyData, error: familyError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('family_code', familyCode)
        .eq('is_active', true)
        .single();

      if (familyError || !familyData) {
        setError('Family group not found or invalid code');
        return false;
      }

      // Add user to family members
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: userId,
          name: userName,
          relationship: relationship,
          role: 'family_member',
        });

      if (memberError) {
        setError(memberError.message);
        return false;
      }

      // Update user's family_id
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ family_id: familyData.id })
        .eq('id', userId);

      if (userUpdateError) {
        setError(userUpdateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { joinFamilyGroup, loading, error };
};

// Hook for fetching family members
export const useFamilyMembers = (familyId: string) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;

    const fetchFamilyMembers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) {
          setError(error.message);
        } else {
          const members: FamilyMember[] = data.map(member => ({
            id: member.id,
            familyId: member.family_id,
            userId: member.user_id,
            name: member.name,
            relationship: member.relationship,
            phone: member.phone || '',
            email: member.email || '',
            role: member.role,
            isActive: member.is_active,
            lastActive: member.last_active || undefined,
          }));
          setFamilyMembers(members);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [familyId]);

  return { familyMembers, loading, error };
};

// Hook for updating elderly profile
export const useUpdateElderlyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateElderlyProfile = async (profileId: string, updates: Partial<ElderlyProfile>) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.age) updateData.age = updates.age;
      if (updates.relationship) updateData.relationship = updates.relationship;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.careLevel) updateData.care_level = updates.careLevel;
      if (updates.conditions) updateData.conditions = updates.conditions;
      if (updates.emergencyContact) updateData.emergency_contact = updates.emergencyContact;
      // Physical information
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.height !== undefined) updateData.height = updates.height;
      if (updates.bloodType) updateData.blood_type = updates.bloodType;
      // Contact & emergency
      if (updates.doctorName !== undefined) updateData.doctor_name = updates.doctorName;
      if (updates.clinicName !== undefined) updateData.clinic_name = updates.clinicName;
      if (updates.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = updates.emergencyContactPhone;

      const { error: updateError } = await supabase
        .from('elderly_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateElderlyProfile, loading, error };
};

// Hook aliases for Phase 2 compatibility
export const useNotes = useCareNotes;
export const useAddNote = useAddCareNote;

// Hook for fetching medication taken records
export const useMedicationTaken = (elderlyId: string) => {
  const [medicationTaken, setMedicationTaken] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!elderlyId) return;

    const fetchMedicationTaken = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('medication_schedules')
          .select(`
            *,
            medications(name, dosage)
          `)
          .eq('elderly_id', elderlyId)
          .eq('taken', true)
          .order('taken_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setMedicationTaken(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicationTaken();
  }, [elderlyId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { medicationTaken, loading, error, refetch };
};

// Hook for deleting appointments
export const useDeleteAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteAppointment, loading, error };
};

// Hook for deleting medications
export const useDeleteMedication = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMedication = async (medicationId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Instead of hard delete, set is_active to false
      const { error: updateError } = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', medicationId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteMedication, loading, error };
};

// Hook for updating user profile
export const useUpdateUserProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user');
        return false;
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.preferredLanguage) updateData.preferred_language = updates.preferredLanguage;

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateUserProfile, loading, error };
};

// Hook for fetching vital signs history for trends
export const useVitalSignsHistory = (elderlyId: string, period: 'week' | 'month' | '3months' = 'week') => {
  const [vitalSignsHistory, setVitalSignsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const calculateBloodPressureStatus = (systolic: number, diastolic: number) => {
    if (systolic === 0 || diastolic === 0) return 'normal';
    if (systolic >= 180 || diastolic >= 110) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'concerning';
    if (systolic < 90 || diastolic < 60) return 'concerning';
    return 'normal';
  };

  const calculateSpO2Status = (value: number) => {
    if (value === 0 || value === 98) return 'normal';
    if (value < 88) return 'critical';
    if (value < 95) return 'concerning';
    return 'normal';
  };

  const calculatePulseStatus = (value: number) => {
    if (value === 0 || value === 72) return 'normal';
    if (value < 50 || value > 120) return 'critical';
    if (value < 60 || value > 100) return 'concerning';
    return 'normal';
  };

  const calculateTemperatureStatus = (value: number) => {
    if (value === 0 || value === 36.5) return 'normal';
    if (value >= 39.5 || value <= 35.0) return 'critical';
    if (value >= 38.0 || value <= 35.5) return 'concerning';
    return 'normal';
  };

  const calculateBloodGlucoseStatus = (value: number, testType: string) => {
    if (value === 0) return 'normal';
    if (testType === 'fasting') {
      if (value >= 11.1 || value < 3.0) return 'critical';
      if (value >= 7.0 || value < 4.0) return 'concerning';
    } else {
      if (value >= 15.0 || value < 3.0) return 'critical';
      if (value >= 11.1 || value < 4.0) return 'concerning';
    }
    return 'normal';
  };

  useEffect(() => {
    if (!elderlyId) return;

    const fetchVitalSignsHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range based on period
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case '3months':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        }

        const { data, error } = await supabase
          .from('vital_signs')
          .select('*')
          .eq('elderly_id', elderlyId)
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) {
          setError(error.message);
        } else {
          // Transform database data to trend format
          const history = data.map(vital => {
            const systolic = parseFloat(vital.systolic?.toString() || '0');
            const diastolic = parseFloat(vital.diastolic?.toString() || '0');
            const spO2 = parseFloat(vital.spo2?.toString() || '0');
            const pulse = parseFloat(vital.pulse?.toString() || '0');
            const temperature = parseFloat(vital.temperature?.toString() || '0');
            const weight = parseFloat(vital.weight?.toString() || '0');
            const bloodGlucose = parseFloat(vital.blood_glucose?.toString() || '0');

            return {
              date: vital.recorded_at,
              systolic,
              diastolic,
              spO2,
              pulse,
              temperature,
              weight,
              bloodGlucose: bloodGlucose > 0 ? bloodGlucose : undefined,
              bloodGlucoseType: vital.blood_glucose_type || 'random',
              recordedBy: vital.recorded_by,
              notes: vital.notes,
              // Add status calculations for each vital
              bloodPressureStatus: calculateBloodPressureStatus(systolic, diastolic),
              spO2Status: calculateSpO2Status(spO2),
              pulseStatus: calculatePulseStatus(pulse),
              temperatureStatus: calculateTemperatureStatus(temperature),
              bloodGlucoseStatus: bloodGlucose > 0 ? calculateBloodGlucoseStatus(bloodGlucose, vital.blood_glucose_type || 'random') : 'normal',
            };
          });

          setVitalSignsHistory(history);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVitalSignsHistory();
  }, [elderlyId, period, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { vitalSignsHistory, loading, error, refetch };
};
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FamilyRole, FamilyMemberWithRole } from '../types';
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
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { user } = useAuth();

  const fetchUserProfile = async () => {
    if (!user) return;

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
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { userProfile, loading, error, refetch };
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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!elderlyId) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [elderlyId, refetchTrigger]);

  const refetch = () => {
    console.log('🔄 Refetching appointments...');
    setRefetchTrigger(prev => prev + 1);
  };

  return { appointments, loading, error, refetch };
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

// Interface for appointment outcomes
export interface AppointmentOutcome {
  id: string;
  appointmentId: string;
  elderlyId: string;
  diagnosis: string;
  doctorNotes: string;
  testResults?: string;
  vitalSignsRecorded?: any;
  newMedications?: string;
  medicationChanges?: string;
  prescriptions?: string;
  recommendations?: string;
  followUpInstructions?: string;
  nextAppointmentRecommended: boolean;
  nextAppointmentTimeframe?: string;
  referrals?: string;
  outcomeRecordedBy: string;
  outcomeRecordedAt: string;
  appointmentDurationMinutes?: number;
  patientSatisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
}

// Hook for creating appointment outcomes
export const useCreateAppointmentOutcome = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOutcome = async (outcomeData: {
    appointmentId: string;
    elderlyId: string;
    diagnosis: string;
    doctorNotes: string;
    testResults?: string;
    newMedications?: string;
    prescriptions?: string;
    recommendations?: string;
    nextAppointmentRecommended?: boolean;
    outcomeRecordedBy: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('appointment_outcomes')
        .insert([{
          appointment_id: outcomeData.appointmentId,
          elderly_id: outcomeData.elderlyId,
          diagnosis: outcomeData.diagnosis,
          doctor_notes: outcomeData.doctorNotes,
          test_results: outcomeData.testResults,
          new_medications: outcomeData.newMedications,
          prescriptions: outcomeData.prescriptions,
          recommendations: outcomeData.recommendations,
          next_appointment_recommended: outcomeData.nextAppointmentRecommended || false,
          outcome_recorded_by: outcomeData.outcomeRecordedBy,
        }])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      // Also update the appointment status to 'completed'
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', outcomeData.appointmentId);

      if (updateError) {
        console.warn('Failed to update appointment status:', updateError.message);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createOutcome, loading, error };
};

// Hook for fetching appointment outcomes
export const useAppointmentOutcomes = (elderlyId: string) => {
  const [outcomes, setOutcomes] = useState<AppointmentOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!elderlyId) return;

    const fetchOutcomes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointment_outcomes')
          .select(`
            *,
            appointments (
              doctor_name,
              clinic,
              appointment_type,
              date,
              time
            )
          `)
          .eq('elderly_id', elderlyId)
          .order('outcome_recorded_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          const formattedOutcomes: AppointmentOutcome[] = data.map(outcome => ({
            id: outcome.id,
            appointmentId: outcome.appointment_id,
            elderlyId: outcome.elderly_id,
            diagnosis: outcome.diagnosis,
            doctorNotes: outcome.doctor_notes,
            testResults: outcome.test_results,
            vitalSignsRecorded: outcome.vital_signs_recorded,
            newMedications: outcome.new_medications,
            medicationChanges: outcome.medication_changes,
            prescriptions: outcome.prescriptions,
            recommendations: outcome.recommendations,
            followUpInstructions: outcome.follow_up_instructions,
            nextAppointmentRecommended: outcome.next_appointment_recommended,
            nextAppointmentTimeframe: outcome.next_appointment_timeframe,
            referrals: outcome.referrals,
            outcomeRecordedBy: outcome.outcome_recorded_by,
            outcomeRecordedAt: outcome.outcome_recorded_at,
            appointmentDurationMinutes: outcome.appointment_duration_minutes,
            patientSatisfactionRating: outcome.patient_satisfaction_rating,
            createdAt: outcome.created_at,
            updatedAt: outcome.updated_at,
          }));
          setOutcomes(formattedOutcomes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomes();
  }, [elderlyId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { outcomes, loading, error, refetch };
};

// Family Role Management Hooks

// Hook to get current user's role in their family
export const useUserFamilyRole = () => {
  const [role, setRole] = useState<FamilyRole | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole('none');
        return;
      }

      // Get user's family info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.family_id) {
        setRole('none');
        return;
      }

      // Get user's role in the family using the secure function to bypass RLS issues
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_family_role', {
          p_user_id: user.id,
          p_family_id: userData.family_id
        });

      if (roleError) {
        // If RPC function doesn't exist, fall back to direct query
        if (roleError.message?.includes('function') && roleError.message?.includes('does not exist')) {
          const { data: directRoleData, error: directRoleError } = await supabase
            .from('user_family_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('family_id', userData.family_id)
            .eq('is_active', true)
            .single();

          if (directRoleError || !directRoleData) {
            setRole('none');
          } else {
            setRole(directRoleData.role as FamilyRole);
          }
        } else {
          setRole('none');
        }
      } else if (!roleData) {
        setRole('none');
      } else {
        // The RPC function returns a string directly, not an object
        setRole(roleData === 'none' ? 'none' : roleData as FamilyRole);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRole('none');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { role, loading, error, refetch };
};

// Hook to get all family members with their roles
export const useFamilyMembersWithRoles = (familyId: string) => {
  const [members, setMembers] = useState<FamilyMemberWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!familyId) return;

    const fetchFamilyMembers = async () => {
      try {
        setLoading(true);

        // Get all active family members with cached user data from user_family_roles
        const { data, error } = await supabase
          .from('user_family_roles')
          .select(`
            user_id,
            user_name,
            user_email,
            role,
            assigned_at
          `)
          .eq('family_id', familyId)
          .eq('is_active', true)
          .order('assigned_at', { ascending: true });

        console.log('Family members query result:', { data, error });

        if (error) {
          setError(error.message);
        } else {
          const formattedMembers: FamilyMemberWithRole[] = data.map((member: any) => ({
            userId: member.user_id,
            name: member.user_name || `User ${member.user_id.slice(0, 8)}...`,
            email: member.user_email || 'No email available',
            role: member.role as FamilyRole | 'none',
            isElderly: false, // We can update this later if needed
            assignedAt: member.assigned_at,
            assignedByName: '', // We can add this later if needed
          }));
          console.log('Formatted family members:', formattedMembers);
          setMembers(formattedMembers);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [familyId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { members, loading, error, refetch };
};

// Hook to update a user's family role (admin only)
export const useUpdateUserFamilyRole = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRole = async (
    targetUserId: string,
    familyId: string,
    newRole: FamilyRole
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        return null;
      }

      const { data, error: rpcError } = await supabase.rpc('update_user_family_role', {
        p_target_user_id: targetUserId,
        p_family_id: familyId,
        p_new_role: newRole,
        p_admin_user_id: user.id
      });

      if (rpcError) {
        setError(rpcError.message);
        return null;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateRole, loading, error };
};

// Hook to check if current user has admin privileges
export const useIsCurrentUserAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Get user's family info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('family_id')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.family_id) {
          setIsAdmin(false);
          return;
        }

        // Check if user is admin in their family
        const { data: adminData, error: adminError } = await supabase.rpc('is_family_admin', {
          p_user_id: user.id,
          p_family_id: userData.family_id
        });

        if (adminError) {
          setError(adminError.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(adminData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, loading, error };
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

// ========================================
// PHASE 1: FAMILY JOIN REQUEST MANAGEMENT
// ========================================

// Interface for family join requests
export interface FamilyJoinRequest {
  id: string;
  familyId: string;
  familyCode: string;
  familyName: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewMessage?: string;
  createdAt: string;
  expiresAt: string;
}

// Hook for creating family join request
export const useCreateFamilyJoinRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJoinRequest = async (familyCode: string, message?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating join request with RPC function');
      console.log('Family code:', familyCode);
      console.log('Message:', message);

      // Use the RPC function to create join request
      const { data: result, error: rpcError } = await supabase
        .rpc('create_family_join_request', {
          p_family_code: familyCode,
          p_request_message: message
        });

      console.log('RPC result:', { result, rpcError });

      if (rpcError) {
        console.log('RPC error:', rpcError);
        setError(rpcError.message);
        return null;
      }

      if (result && result.success) {
        console.log('Join request created successfully');
        return result;
      } else {
        console.log('Join request failed:', result);
        setError(result?.error || 'Failed to create join request');
        return null;
      }
    } catch (err) {
      console.error('Create join request error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createJoinRequest, loading, error };
};

// Hook for reviewing family join requests (admin only)
export const useReviewFamilyJoinRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewRequest = async (
    requestId: string,
    action: 'approve' | 'reject',
    _reviewMessage?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required');
        return false;
      }

      // Use the RPC function to review the join request
      const { data: result, error: rpcError } = await supabase
        .rpc('review_family_join_request', {
          p_request_id: requestId,
          p_action: action,
          p_review_message: _reviewMessage || null
        });

      if (rpcError) {
        console.error('Review join request error:', rpcError);
        setError(rpcError.message || 'Failed to review request');
        return false;
      }

      if (!result?.success) {
        setError(result?.message || 'Failed to review request');
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

  return { reviewRequest, loading, error };
};

// Hook for fetching pending join requests (admin only)
export const usePendingJoinRequests = (familyId: string) => {
  const [requests, setRequests] = useState<FamilyJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!familyId) return;

    const fetchPendingRequests = async () => {
      try {
        setLoading(true);

        // Get join requests with cached user data
        console.log('Fetching join requests for familyId:', familyId);
        const { data: joinRequestsData, error: joinRequestsError } = await supabase
          .from('family_join_requests')
          .select(`
            id,
            user_id,
            user_name,
            user_email,
            family_id,
            family_code,
            request_message,
            status,
            requested_at
          `)
          .eq('family_id', familyId)
          .eq('status', 'pending')
          .order('requested_at', { ascending: false });

        if (joinRequestsError) {
          console.error('Error fetching join requests:', joinRequestsError);
          setError(joinRequestsError.message);
          return;
        }

        if (!joinRequestsData || joinRequestsData.length === 0) {
          console.log('No pending join requests found');
          setRequests([]);
          return;
        }

        console.log('Found join requests with user data:', joinRequestsData);

        // Map the data directly since we have cached user info
        const formattedRequests: FamilyJoinRequest[] = joinRequestsData.map((req: any) => ({
          id: req.id,
          familyId: req.family_id,
          familyCode: req.family_code,
          familyName: '',
          requesterId: req.user_id,
          requesterEmail: req.user_email || `User ID: ${req.user_id.slice(0, 8)}...`,
          requesterName: req.user_name || `User ${req.user_id.slice(0, 8)}...`,
          message: req.request_message || 'No message provided',
          status: req.status,
          createdAt: req.requested_at,
          expiresAt: '',
        }));

        console.log('Final formatted requests:', formattedRequests);
        setRequests(formattedRequests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [familyId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { requests, loading, error, refetch };
};

// Hook for validating family code
export const useValidateFamilyCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFamilyCode = async (familyCode: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!familyCode || familyCode.length !== 6) {
        return { isValid: false, error: 'Family code must be 6 digits' };
      }

      // Use RPC function to bypass RLS for family code validation
      const { data: validationResult, error: rpcError } = await supabase
        .rpc('validate_family_code_for_join', { family_code_param: familyCode });

      console.log('Family validation result:', { validationResult, rpcError });

      if (rpcError) {
        console.log('RPC validation failed:', rpcError);
        return { isValid: false, error: 'Validation failed. Please try again.' };
      }

      return validationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { isValid: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { validateFamilyCode, loading, error };
};

// Hook for checking current user's join request status (without family code)
export const useCurrentUserJoinRequestStatus = () => {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching join request status...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        setStatus('none');
        setData(null);
        return;
      }

      console.log('👤 User ID:', user.id);

      // Use RPC function to bypass RLS policies completely
      const { data: joinRequestResult, error: requestError } = await supabase
        .rpc('get_user_join_request_status_detailed', { p_user_id: user.id });

      console.log('📡 RPC Response:', { joinRequestResult, requestError });

      if (requestError) {
        console.log('❌ Error fetching join request status:', requestError);
        setError(requestError.message);
        setStatus('none');
        setData(null);
        return;
      }

      if (joinRequestResult && joinRequestResult.has_request) {
        console.log('✅ Found join request:', joinRequestResult.status);
        setStatus(joinRequestResult.status);
        setData({
          requestId: joinRequestResult.request_id,
          familyName: joinRequestResult.family_name,
          familyCode: joinRequestResult.family_code,
          requestMessage: joinRequestResult.request_message,
          requestedAt: joinRequestResult.requested_at,
          reviewedAt: joinRequestResult.reviewed_at,
          reviewMessage: joinRequestResult.review_message,
        });
      } else {
        console.log('🚫 No join request found or RPC returned null');
        setStatus('none');
        setData(null);
      }
    } catch (err) {
      console.error('Error in useCurrentUserJoinRequestStatus:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('none');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    data,
    loading,
    error,
    refetch: fetchStatus
  };
};

// Hook for checking user's join request status
export const useUserJoinRequestStatus = (familyCode: string) => {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyCode) return;

    const checkRequestStatus = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus('none');
          return;
        }

        // Get user profile
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', user.id)
          .single();

        if (userError || !userProfile) {
          setStatus('none');
          return;
        }

        // Find family by code
        const { data: family, error: familyError } = await supabase
          .from('family_groups')
          .select('id')
          .eq('family_code', familyCode)
          .eq('is_active', true)
          .single();

        if (familyError || !family) {
          setStatus('none');
          return;
        }

        // Check for existing request
        const { data: request, error: requestError } = await supabase
          .from('family_invitations')
          .select('status')
          .eq('family_id', family.id)
          .eq('invitee_email', userProfile.email)
          .order('created_at', { ascending: false })
          .limit(1);

        if (requestError) {
          setError(requestError.message);
          setStatus('none');
        } else if (request && request.length > 0) {
          setStatus(request[0].status as any);
        } else {
          setStatus('none');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('none');
      } finally {
        setLoading(false);
      }
    };

    checkRequestStatus();
  }, [familyCode]);

  return { status, loading, error };
};

// ========================================
// ROLE PERMISSION UTILITIES
// ========================================

// Role permissions definition
export const ROLE_PERMISSIONS = {
  admin: {
    canViewHealth: true,
    canEditHealth: true,
    canManageMedications: true,
    canManageAppointments: true,
    canManageFamily: true,
    canInviteMembers: true,
    canChangeRoles: true,
    canDeleteData: true,
  },
  carer: {
    canViewHealth: true,
    canEditHealth: true,
    canManageMedications: true,
    canManageAppointments: true,
    canManageFamily: false,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteData: false,
  },
  family_viewer: {
    canViewHealth: true,
    canEditHealth: false,
    canManageMedications: false,
    canManageAppointments: false,
    canManageFamily: false,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteData: false,
  },
  none: {
    canViewHealth: false,
    canEditHealth: false,
    canManageMedications: false,
    canManageAppointments: false,
    canManageFamily: false,
    canInviteMembers: false,
    canChangeRoles: false,
    canDeleteData: false,
  },
} as const;

// Hook for getting role permissions
export const useRolePermissions = (role?: FamilyRole | 'none') => {
  const { role: currentRole } = useUserFamilyRole();
  const effectiveRole = role || currentRole;

  return ROLE_PERMISSIONS[effectiveRole] || ROLE_PERMISSIONS.none;
};
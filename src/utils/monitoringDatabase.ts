import { supabase } from './supabase';

export interface MonitoringRecord {
  id: string;
  plant: string;
  tanggal: string;
  line: string;
  regu: string;
  shift: string;
  area: string;
  data_number: number;
  foto_url: string | null;
  keterangan: string | null;
  status: 'draft' | 'complete';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const AREA_OPTIONS = [
  'Silo',
  'Alkali Ingredient',
  'Mixer',
  'Roll Press',
  'Steambox',
  'Cutter',
  'Cutter & Folder',
  'Fryer',
  'Dryer',
  'Cooling Box',
  'Packing'
];

export const REGU_OPTIONS = ['A', 'B', 'C'];
export const SHIFT_OPTIONS = ['1', '2', '3'];

export const getMonitoringRecords = async (
  plant: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    lines?: string[];
    regus?: string[];
    shifts?: string[];
  }
): Promise<MonitoringRecord[]> => {
  try {
    let query = supabase
      .from('monitoring_records')
      .select('*')
      .eq('plant', plant)
      .order('tanggal', { ascending: false })
      .order('data_number', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('tanggal', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('tanggal', filters.endDate);
    }
    if (filters?.lines && filters.lines.length > 0) {
      query = query.in('line', filters.lines);
    }
    if (filters?.regus && filters.regus.length > 0) {
      query = query.in('regu', filters.regus);
    }
    if (filters?.shifts && filters.shifts.length > 0) {
      query = query.in('shift', filters.shifts);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching monitoring records:', error);
    throw error;
  }
};

export const saveMonitoringRecord = async (record: Partial<MonitoringRecord>): Promise<MonitoringRecord> => {
  try {
    const { data, error } = await supabase
      .from('monitoring_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving monitoring record:', error);
    throw error;
  }
};

export const updateMonitoringRecord = async (
  id: string,
  updates: Partial<MonitoringRecord>
): Promise<MonitoringRecord> => {
  try {
    const { data, error } = await supabase
      .from('monitoring_records')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating monitoring record:', error);
    throw error;
  }
};

export const deleteMonitoringRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('monitoring_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting monitoring record:', error);
    throw error;
  }
};

export const deleteMonitoringSession = async (
  plant: string,
  tanggal: string,
  line: string,
  regu: string,
  shift: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('monitoring_records')
      .delete()
      .eq('plant', plant)
      .eq('tanggal', tanggal)
      .eq('line', line)
      .eq('regu', regu)
      .eq('shift', shift);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting monitoring session:', error);
    throw error;
  }
};

export const updateMonitoringSessionStatus = async (
  plant: string,
  tanggal: string,
  line: string,
  regu: string,
  shift: string,
  area: string,
  status: 'draft' | 'complete'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('monitoring_records')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('plant', plant)
      .eq('tanggal', tanggal)
      .eq('line', line)
      .eq('regu', regu)
      .eq('shift', shift)
      .eq('area', area);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating monitoring session status:', error);
    throw error;
  }
};

export const uploadMonitoringPhoto = async (file: File, recordId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}_${Date.now()}.${fileExt}`;
    const filePath = `monitoring/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading monitoring photo:', error);
    throw error;
  }
};

export const deleteMonitoringPhoto = async (photoUrl: string): Promise<void> => {
  try {
    const path = photoUrl.split('/photos/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('photos')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting monitoring photo:', error);
    throw error;
  }
};

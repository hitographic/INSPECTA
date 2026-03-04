import { gGet, gPost, uploadPhotoFromDataUrl, getDriveDirectUrl } from './googleApi';
import { logDelete } from './auditLog';

export interface MonitoringRecord {
  id: string;
  plant: string;
  tanggal: string;
  line: string;
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
  'Silo', 'Alkali Ingredient', 'Mixer', 'Roll Press', 'Steambox',
  'Cutter', 'Cutter & Folder', 'Fryer', 'Dryer', 'Cooling Box', 'Packing'
];

export const getMonitoringRecords = async (
  plant: string,
  filters?: { startDate?: string; endDate?: string; lines?: string[]; }
): Promise<MonitoringRecord[]> => {
  try {
    const params: Record<string, string> = { plant };
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.lines && filters.lines.length > 0) params.lines = filters.lines.join(',');

    const data = await gGet('getMonitoringRecords', params);
    return (data || []).map((r: any) => ({ ...r, foto_url: null }));
  } catch (error) {
    console.error('Error fetching monitoring records:', error);
    throw error;
  }
};

export const getMonitoringRecordsWithPhotos = async (
  plant: string, tanggal: string, line: string
): Promise<MonitoringRecord[]> => {
  try {
    const data = await gGet('getMonitoringRecordsWithPhotos', { plant, tanggal, line });
    return (data || []).map((r: any) => ({
      ...r,
      foto_url: r.foto_url ? getDriveDirectUrl(r.foto_url) : null
    }));
  } catch (error) {
    console.error('Error fetching monitoring records with photos:', error);
    throw error;
  }
};

export const saveMonitoringRecord = async (record: Partial<MonitoringRecord>): Promise<MonitoringRecord> => {
  try {
    const result = await gPost('saveMonitoringRecord', record);
    if (!result.success) throw new Error(result.error || 'Save failed');
    return result.data;
  } catch (error) {
    console.error('Error saving monitoring record:', error);
    throw error;
  }
};

export const updateMonitoringRecord = async (
  id: string, updates: Partial<MonitoringRecord>
): Promise<MonitoringRecord> => {
  try {
    const result = await gPost('updateMonitoringRecord', { id, ...updates, updated_at: new Date().toISOString() });
    if (!result.success) throw new Error(result.error || 'Update failed');
    return result.data;
  } catch (error) {
    console.error('Error updating monitoring record:', error);
    throw error;
  }
};

export const deleteMonitoringRecord = async (id: string): Promise<void> => {
  try {
    // Get record for audit log
    const records = await gGet('getMonitoringRecordsWithPhotos', { plant: '', tanggal: '', line: '' });
    const record = (records || []).find((r: any) => r.id === id);

    if (record) {
      const currentUserStr = localStorage.getItem('currentUser');
      let deletedBy = 'anonymous';
      if (currentUserStr) {
        try { const cu = JSON.parse(currentUserStr); deletedBy = cu.full_name || cu.username || 'anonymous'; } catch {}
      }
      await logDelete({
        table_name: 'monitoring_records', record_id: id, affected_count: 1,
        deleted_by: deletedBy, plant: record.plant,
        additional_info: { line: record.line, tanggal: record.tanggal }
      });
    }

    const result = await gPost('deleteMonitoringRecord', { id });
    if (!result.success) throw new Error(result.error || 'Delete failed');
  } catch (error) {
    console.error('Error deleting monitoring record:', error);
    throw error;
  }
};

export const deleteMonitoringSession = async (
  plant: string, tanggal: string, line: string
): Promise<void> => {
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    let deletedBy = 'anonymous';
    if (currentUserStr) {
      try { const cu = JSON.parse(currentUserStr); deletedBy = cu.full_name || cu.username || 'anonymous'; } catch {}
    }
    await logDelete({
      table_name: 'monitoring_records',
      record_id: `${plant}_${tanggal}_${line}`,
      affected_count: 0,
      deleted_by: deletedBy,
      action: 'BULK_DELETE_SESSION',
      plant: plant,
      additional_info: { line, tanggal }
    });

    const result = await gPost('deleteMonitoringSession', { plant, tanggal, line });
    if (!result.success) throw new Error(result.error || 'Delete session failed');
  } catch (error) {
    console.error('Error deleting monitoring session:', error);
    throw error;
  }
};

export const deleteMultipleMonitoringRecords = async (recordIds: string[]): Promise<void> => {
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    let deletedBy = 'anonymous';
    if (currentUserStr) {
      try { const cu = JSON.parse(currentUserStr); deletedBy = cu.full_name || cu.username || 'anonymous'; } catch {}
    }
    await logDelete({
      table_name: 'monitoring_records',
      record_id: recordIds.join(','),
      affected_count: recordIds.length,
      deleted_by: deletedBy,
      action: 'BULK_DELETE_MULTIPLE'
    });

    const result = await gPost('deleteMultipleMonitoringRecords', { ids: recordIds });
    if (!result.success) throw new Error(result.error || 'Delete multiple failed');
  } catch (error) {
    console.error('Error deleting multiple monitoring records:', error);
    throw error;
  }
};

export const updateMonitoringSessionStatus = async (
  plant: string, tanggal: string, line: string,
  regu: string, shift: string, area: string,
  status: 'draft' | 'complete'
): Promise<void> => {
  try {
    const result = await gPost('updateMonitoringSessionStatus', { plant, tanggal, line, regu, shift, area, status });
    if (!result.success) throw new Error(result.error || 'Update status failed');
  } catch (error) {
    console.error('Error updating monitoring session status:', error);
    throw error;
  }
};

export const uploadMonitoringPhoto = async (file: File, recordId: string): Promise<string> => {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fileName = `monitoring_${recordId}_${Date.now()}.jpg`;
    const result = await uploadPhotoFromDataUrl(dataUrl, fileName, 'monitoring');
    if (!result.success || !result.directUrl) {
      throw new Error(result.error || 'Upload failed');
    }
    return result.directUrl;
  } catch (error) {
    console.error('Error uploading monitoring photo:', error);
    throw error;
  }
};

export const deleteMonitoringPhoto = async (_photoUrl: string): Promise<void> => {
  // Google Drive files are not deleted - they stay in the folder
  console.log('[MONITORING] Photo deletion from Google Drive is not implemented');
};

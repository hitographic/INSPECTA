import { gGet, gPost, uploadPhotoFromDataUrl, getDriveDirectUrl, normalizeDate, normalizeDatesInRecords } from './googleApi';
import { logDelete } from './auditLog';
import { KlipingRecord } from '../types/database';

export const insertKlipingRecord = async (
  record: KlipingRecord,
  skipDuplicateCheck: boolean = false
): Promise<{ success: boolean; id?: string; error?: string; skipped?: boolean; rawError?: any }> => {
  try {
    // Upload photos to Google Drive before saving
    const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
      'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'] as const;

    const recordData: any = { ...record, skipDuplicateCheck };

    for (const field of photoFields) {
      const val = record[field];
      if (val && typeof val === 'string' && val.startsWith('data:image')) {
        const fileName = `${field}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const uploadResult = await uploadPhotoFromDataUrl(val, fileName, 'kliping');
        if (uploadResult.success && uploadResult.directUrl) {
          recordData[field] = uploadResult.directUrl;
        } else {
          console.error(`[KLIPING] Failed to upload ${field}:`, uploadResult.error);
          recordData[field] = '';
        }
      }
    }

    const result = await gPost('insertKlipingRecord', recordData);

    if (!result.success) {
      return { success: false, error: result.error || 'Insert failed', rawError: result };
    }

    return { success: true, id: result.id, skipped: result.skipped };
  } catch (error) {
    console.error('Error in insertKlipingRecord:', error);
    return { success: false, error: String((error as any)?.message || error), rawError: error };
  }
};

export const updateKlipingRecord = async (id: string, updates: Partial<KlipingRecord>): Promise<{ success: boolean; error?: string }> => {
  try {
    // Upload any new photos
    const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
      'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'] as const;

    const updateData: any = { id, ...updates };

    for (const field of photoFields) {
      const val = (updates as any)[field];
      if (val && typeof val === 'string' && val.startsWith('data:image')) {
        const fileName = `${field}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const uploadResult = await uploadPhotoFromDataUrl(val, fileName, 'kliping');
        if (uploadResult.success && uploadResult.directUrl) {
          updateData[field] = uploadResult.directUrl;
        }
      }
    }

    const result = await gPost('updateKlipingRecord', updateData);
    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error in updateKlipingRecord:', error);
    return { success: false, error: String(error) };
  }
};

export const countKlipingPhotos = async (filters?: {
  plant?: string; startDate?: string; endDate?: string;
  line?: string; regu?: string; shift?: string;
}): Promise<{ [key: string]: number }> => {
  try {
    console.log('[KLIPING] countKlipingPhotos called with filters:', filters);
    const params: Record<string, string> = {};
    if (filters?.plant) params.plant = filters.plant;
    const data = await gGet('countKlipingPhotos', params);
    console.log('[KLIPING] Photo counts:', data);
    return data || {};
  } catch (error) {
    console.error('[KLIPING] Exception in countKlipingPhotos:', error);
    return {};
  }
};

export const getKlipingRecords = async (filters?: {
  plant?: string; startDate?: string; endDate?: string;
  line?: string; regu?: string; shift?: string;
}): Promise<KlipingRecord[]> => {
  try {
    console.log('[KLIPING] Fetching records with filters:', filters);
    const params: Record<string, string> = {};
    if (filters?.plant) params.plant = filters.plant;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.line) params.line = filters.line;
    if (filters?.regu) params.regu = filters.regu;
    if (filters?.shift) params.shift = filters.shift;

    const data = await gGet('getKlipingRecords', params);
    console.log('[KLIPING] Fetched records:', data?.length || 0);
    return normalizeDatesInRecords(data || []);
  } catch (error) {
    console.error('[KLIPING] Exception in getKlipingRecords:', error);
    return [];
  }
};

export const getKlipingRecordById = async (id: string): Promise<KlipingRecord | null> => {
  try {
    const data = await gGet('getKlipingRecordById', { id });
    if (!data) return null;
    // Normalize date
    if (data.tanggal) data.tanggal = normalizeDate(data.tanggal);
    // Convert Drive URLs to direct URLs for display
    const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
      'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
    for (const f of photoFields) {
      if (data[f]) data[f] = getDriveDirectUrl(data[f]);
    }
    return data;
  } catch (error) {
    console.error('Error in getKlipingRecordById:', error);
    return null;
  }
};

export const getKlipingRecordPhotos = async (filters: {
  plant: string; tanggal: string; line: string; regu: string;
  shift: string; pengamatan_ke: number; mesin: string;
}): Promise<Partial<KlipingRecord> | null> => {
  try {
    console.log('[KLIPING] Fetching photos with filters:', filters);
    const params: Record<string, string> = {
      plant: filters.plant,
      tanggal: normalizeDate(filters.tanggal),
      line: filters.line,
      regu: filters.regu,
      shift: filters.shift,
      pengamatan_ke: String(filters.pengamatan_ke),
      mesin: filters.mesin
    };
    const data = await gGet('getKlipingRecordPhotos', params);
    if (!data) return null;
    // Convert Drive URLs
    const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
      'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
    for (const f of photoFields) {
      if (data[f]) data[f] = getDriveDirectUrl(data[f]);
    }
    return data;
  } catch (error) {
    console.error('[KLIPING] Exception in getKlipingRecordPhotos:', error);
    return null;
  }
};

export const getKlipingRecordsWithPhotos = async (filters?: {
  plant?: string; startDate?: string; endDate?: string;
  line?: string; regu?: string; shift?: string;
}): Promise<KlipingRecord[]> => {
  try {
    console.log('[KLIPING] Fetching records WITH PHOTOS');
    const params: Record<string, string> = { withPhotos: 'true' };
    if (filters?.plant) params.plant = filters.plant;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.line) params.line = filters.line;
    if (filters?.regu) params.regu = filters.regu;
    if (filters?.shift) params.shift = filters.shift;

    const data = await gGet('getKlipingRecords', params);
    // Convert Drive URLs for photos
    const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
      'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
    return normalizeDatesInRecords((data || []).map((r: any) => {
      for (const f of photoFields) {
        if (r[f]) r[f] = getDriveDirectUrl(r[f]);
      }
      return r;
    }));
  } catch (error) {
    console.error('[KLIPING] Error in getKlipingRecordsWithPhotos:', error);
    return [];
  }
};

export const deleteKlipingRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const record = await getKlipingRecordById(id);
    if (record) {
      const currentUserStr = localStorage.getItem('currentUser');
      let deletedBy = 'anonymous';
      if (currentUserStr) {
        try { const cu = JSON.parse(currentUserStr); deletedBy = cu.full_name || cu.username || 'anonymous'; } catch {}
      }
      await logDelete({
        table_name: 'kliping_records', record_id: id, affected_count: 1,
        deleted_by: deletedBy, plant: record.plant,
        additional_info: { line: record.line, tanggal: record.tanggal, regu: record.regu, shift: record.shift, id_unik: record.id_unik }
      });
    }

    const result = await gPost('deleteKlipingRecord', { id });
    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error in deleteKlipingRecord:', error);
    return { success: false, error: String(error) };
  }
};

export const deleteKlipingRecordsByIdUnik = async (idUnik: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Log the deletion
    const records = await getKlipingRecords();
    const matching = records.filter(r => r.id_unik === idUnik);

    if (matching.length > 0) {
      const currentUserStr = localStorage.getItem('currentUser');
      let deletedBy = 'anonymous';
      if (currentUserStr) {
        try { const cu = JSON.parse(currentUserStr); deletedBy = cu.full_name || cu.username || 'anonymous'; } catch {}
      }
      const first = matching[0];
      await logDelete({
        table_name: 'kliping_records', record_id: idUnik, affected_count: matching.length,
        deleted_by: deletedBy, action: 'BULK_DELETE', plant: first.plant,
        additional_info: { line: first.line, tanggal: first.tanggal, regu: first.regu, shift: first.shift }
      });
    }

    const result = await gPost('deleteKlipingByIdUnik', { id_unik: idUnik });
    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (error) {
    console.error('Error in deleteKlipingRecordsByIdUnik:', error);
    return { success: false, error: String(error) };
  }
};

export const getLinesFromDatabase = async (): Promise<string[]> => {
  return ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8'];
};

export const REGU_OPTIONS = ['A', 'B', 'C'];
export const SHIFT_OPTIONS = ['1', '2', '3'];
export const MESIN_OPTIONS = ['Mesin 1', 'Mesin 2', 'Mesin 3', 'Mesin 4'];

export const FOTO_TYPES = [
  { key: 'foto_etiket', label: 'Foto Etiket', description: 'Ambil foto etiket' },
  { key: 'foto_banded', label: 'Foto Banded', description: 'Ambil foto banded' },
  { key: 'foto_karton', label: 'Foto Karton', description: 'Ambil foto karton' },
  { key: 'foto_label_etiket', label: 'Foto Label Etiket', description: 'Ambil foto label etiket' },
  { key: 'foto_label_bumbu', label: 'Foto Label Bumbu', description: 'Ambil foto label bumbu' },
  { key: 'foto_label_minyak_bumbu', label: 'Foto Label Minyak Bumbu', description: 'Ambil foto label minyak bumbu' },
  { key: 'foto_label_si', label: 'Foto Label SI', description: 'Ambil foto label SI' },
  { key: 'foto_label_opp_banded', label: 'Foto Label OPP Banded', description: 'Ambil foto label OPP banded' },
];

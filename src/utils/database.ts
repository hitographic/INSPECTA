import { SanitationRecord } from '../types/database';
import { gGet, gPost, uploadPhotoFromDataUrl, getDriveDirectUrl, normalizeDate } from './googleApi';
import { logDelete } from './auditLog';

const DEBUG = true;
const log = (message: string, data?: any) => {
  if (DEBUG) console.log(`[DATABASE] ${message}`, data || '');
};

/**
 * Compress a base64 data URL image to reduce upload payload size.
 * Resizes to max 800x800 and compresses to JPEG quality 0.7.
 * This reduces ~2MB base64 to ~200-400KB, making uploads 3-5x faster.
 */
function compressForUpload(dataUrl: string, maxDim: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        // Only downscale if larger than maxDim
        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        log(`Compressed: ${(dataUrl.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

class DatabaseManager {
  async init(): Promise<void> {
    try {
      log('Testing database connection...');
      const data = await gGet('getSanitationRecords', { limit: '1' });
      log('Database connection successful', { count: data?.length || 0 });
    } catch (error) {
      log('Failed to connect to database (non-fatal):', error);
    }
  }

  private async uploadPhotoIfNeeded(photoUri: string | undefined | null, folder: string): Promise<string | null> {
    if (!photoUri) return null;
    if (photoUri.includes('drive.google.com') || photoUri.includes('googleusercontent.com')) return photoUri;
    if (photoUri.startsWith('data:image')) {
      // Compress before upload to reduce payload size and speed up transfer
      const compressed = await compressForUpload(photoUri);
      const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const result = await uploadPhotoFromDataUrl(compressed, fileName, folder);
      if (result.success && result.directUrl) return result.directUrl;
      log('Photo upload failed:', result.error);
      return null;
    }
    return photoUri;
  }

  private mapRecord(record: any): SanitationRecord {
    return {
      id: record.id,
      plant: String(record.plant || ''),
      line: String(record.line || ''),
      area: String(record.area || ''),
      bagian: String(record.bagian || ''),
      photoBeforeUri: getDriveDirectUrl(record.foto_sebelum),
      photoAfterUri: getDriveDirectUrl(record.foto_sesudah),
      foto_sebelum: getDriveDirectUrl(record.foto_sebelum),
      foto_sebelum_timestamp: record.foto_sebelum_timestamp,
      foto_sesudah: getDriveDirectUrl(record.foto_sesudah),
      foto_sesudah_timestamp: record.foto_sesudah_timestamp,
      keterangan: record.keterangan,
      tanggal: normalizeDate(record.tanggal),
      createdAt: record.created_at,
      created_at: record.created_at,
      created_by: record.created_by,
      updated_at: record.updated_at,
      status: record.status as 'draft' | 'completed'
    };
  }

  async insertRecord(record: Omit<SanitationRecord, 'id'>): Promise<number> {
    log('Starting insertRecord...', { plant: record.plant, line: record.line, area: record.area, bagian: record.bagian });

    const currentUserStr = localStorage.getItem('currentUser');
    let createdBy = 'anonymous';
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        createdBy = currentUser.full_name || currentUser.username || 'anonymous';
      } catch { createdBy = 'anonymous'; }
    }

    // Upload both photos in parallel for 2x speed improvement
    const [fotoSebelum, fotoSesudah] = await Promise.all([
      this.uploadPhotoIfNeeded(record.photoBeforeUri, 'sanitation'),
      this.uploadPhotoIfNeeded(record.photoAfterUri, 'sanitation')
    ]);

    const result = await gPost('insertSanitationRecord', {
      plant: record.plant,
      line: record.line,
      tanggal: record.tanggal,
      area: record.area,
      bagian: record.bagian,
      foto_sebelum: fotoSebelum || '',
      foto_sesudah: fotoSesudah || '',
      keterangan: record.keterangan || '',
      status: record.status || 'completed',
      created_by: createdBy,
      foto_sebelum_timestamp: record.foto_sebelum_timestamp || '',
      foto_sesudah_timestamp: record.foto_sesudah_timestamp || ''
    });

    if (!result.success) throw new Error(result.error || 'Insert failed');
    log('Record inserted successfully:', result.id);
    return result.id;
  }

  async getAllRecords(): Promise<SanitationRecord[]> {
    try {
      log('Fetching all records...');
      const data = await gGet('getSanitationRecords');
      log('Records fetched:', { count: data?.length || 0 });
      return (data || []).map((r: any) => this.mapRecord(r));
    } catch (error) {
      log('Failed to fetch records:', error);
      return [];
    }
  }

  async getRecordsMetadata(plant: string, line: string, tanggal: string): Promise<any[]> {
    try {
      log('Fetching records metadata:', { plant, line, tanggal });
      const data = await gGet('getSanitationRecordsMetadata', { plant, line, tanggal });
      return data || [];
    } catch (error) {
      log('Failed to fetch records metadata:', error);
      return [];
    }
  }

  async getRecordsByPlant(plant: string, status?: 'draft' | 'completed', limit?: number): Promise<SanitationRecord[]> {
    try {
      const params: Record<string, string> = { plant };
      if (status) params.status = status;
      else params.excludeStatus = 'draft';
      if (limit) params.limit = String(limit);
      const data = await gGet('getSanitationRecords', params);
      return (data || []).map((r: any) => ({
        ...this.mapRecord(r),
        photoBeforeUri: undefined,
        photoAfterUri: undefined,
        foto_sebelum: undefined,
        foto_sesudah: undefined
      }));
    } catch (error) {
      log('Failed to fetch records by plant:', error);
      return [];
    }
  }

  /**
   * Get records by plant WITH photo URIs included (for export).
   * This avoids the need to re-fetch each record individually.
   */
  async getRecordsByPlantWithPhotos(plant: string, status?: 'draft' | 'completed', limit?: number): Promise<SanitationRecord[]> {
    try {
      const params: Record<string, string> = { plant };
      if (status) params.status = status;
      else params.excludeStatus = 'draft';
      if (limit) params.limit = String(limit);
      const data = await gGet('getSanitationRecords', params);
      return (data || []).map((r: any) => this.mapRecord(r));
    } catch (error) {
      log('Failed to fetch records by plant with photos:', error);
      return [];
    }
  }

  async getRecordById(id: number): Promise<SanitationRecord | null> {
    try {
      const data = await gGet('getSanitationRecordById', { id: String(id) });
      if (!data) return null;
      return this.mapRecord(data);
    } catch (error) {
      log('Failed to fetch record by id:', error);
      return null;
    }
  }

  async getRecordsByDate(date: string): Promise<SanitationRecord[]> {
    try {
      const data = await gGet('getSanitationRecords', { tanggal: date });
      return (data || []).map((r: any) => this.mapRecord(r));
    } catch (error) {
      console.error('Failed to fetch records by date:', error);
      return [];
    }
  }

  async updateRecord(id: number, record: Partial<SanitationRecord>): Promise<void> {
    log('Starting updateRecord...', { id });
    const updateData: any = { id: String(id) };
    if (record.plant) updateData.plant = record.plant;
    if (record.line) updateData.line = record.line;
    if (record.tanggal) updateData.tanggal = record.tanggal;
    if (record.area) updateData.area = record.area;
    if (record.bagian) updateData.bagian = record.bagian;
    if (record.keterangan !== undefined) updateData.keterangan = record.keterangan;
    if (record.status) updateData.status = record.status;
    if (record.foto_sebelum_timestamp !== undefined) updateData.foto_sebelum_timestamp = record.foto_sebelum_timestamp;
    if (record.foto_sesudah_timestamp !== undefined) updateData.foto_sesudah_timestamp = record.foto_sesudah_timestamp;

    // Upload both photos in parallel for 2x speed improvement
    const needsBefore = record.photoBeforeUri !== undefined;
    const needsAfter = record.photoAfterUri !== undefined;

    if (needsBefore || needsAfter) {
      const [beforeResult, afterResult] = await Promise.all([
        needsBefore ? this.uploadPhotoIfNeeded(record.photoBeforeUri, 'sanitation') : Promise.resolve(undefined),
        needsAfter ? this.uploadPhotoIfNeeded(record.photoAfterUri, 'sanitation') : Promise.resolve(undefined)
      ]);
      if (needsBefore) updateData.foto_sebelum = beforeResult || '';
      if (needsAfter) updateData.foto_sesudah = afterResult || '';
    }

    const result = await gPost('updateSanitationRecord', updateData);
    if (!result.success) throw new Error(result.error || 'Update failed');
    log('Record updated successfully');
  }

  async deleteRecord(id: number): Promise<void> {
    try {
      const record = await this.getRecordById(id);
      if (!record) throw new Error('Record not found');

      const currentUserStr = localStorage.getItem('currentUser');
      let deletedBy = 'anonymous';
      if (currentUserStr) {
        try {
          const cu = JSON.parse(currentUserStr);
          deletedBy = cu.full_name || cu.username || 'anonymous';
        } catch {}
      }

      await logDelete({
        table_name: 'sanitation_records',
        record_id: id.toString(),
        affected_count: 1,
        deleted_by: deletedBy,
        plant: record.plant,
        additional_info: { line: record.line, area: record.area, bagian: record.bagian, tanggal: record.tanggal }
      });

      const result = await gPost('deleteSanitationRecord', { id: String(id) });
      if (!result.success) throw new Error(result.error || 'Delete failed');
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error;
    }
  }

  async checkRecordExists(plant: string, line: string, tanggal: string): Promise<boolean> {
    try {
      const data = await gGet('getSanitationRecords', { plant, line, tanggal });
      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    console.warn('clearAllData not supported with Google Sheets backend');
  }

  /**
   * Batch update status for multiple records in one API call.
   * Much faster than calling updateRecord N times for status-only changes.
   */
  async batchUpdateStatus(ids: (number | string)[], status: 'draft' | 'completed'): Promise<{ updatedCount: number; totalRequested: number }> {
    log('Starting batchUpdateStatus...', { count: ids.length, status });
    const result = await gPost('batchUpdateSanitationStatus', {
      ids: ids.map(id => String(id)),
      status
    });
    if (!result.success) throw new Error(result.error || 'Batch update failed');
    log('Batch update successful:', result);
    return { updatedCount: result.updatedCount, totalRequested: result.totalRequested };
  }
}

const dbManager = new DatabaseManager();
export const initDatabase = () => dbManager.init();
export const insertRecord = (record: Omit<SanitationRecord, 'id'>) => dbManager.insertRecord(record);
export const getAllRecords = () => dbManager.getAllRecords();
export const getRecordsMetadata = (plant: string, line: string, tanggal: string) => dbManager.getRecordsMetadata(plant, line, tanggal);
export const getRecordsByPlant = (plant: string, status?: 'draft' | 'completed', limit?: number) => dbManager.getRecordsByPlant(plant, status, limit);
export const getRecordsByPlantWithPhotos = (plant: string, status?: 'draft' | 'completed', limit?: number) => dbManager.getRecordsByPlantWithPhotos(plant, status, limit);
export const getRecordById = (id: number) => dbManager.getRecordById(id);
export const getRecordsByDate = (date: string) => dbManager.getRecordsByDate(date);
export const updateRecord = (id: number, record: Partial<SanitationRecord>) => dbManager.updateRecord(id, record);
export const deleteRecord = (id: number) => dbManager.deleteRecord(id);
export const checkRecordExists = (plant: string, line: string, tanggal: string) => dbManager.checkRecordExists(plant, line, tanggal);
export const clearAllData = () => dbManager.clearAllData();
export const batchUpdateStatus = (ids: (number | string)[], status: 'draft' | 'completed') => dbManager.batchUpdateStatus(ids, status);

import { SanitationRecord } from '../types/database';
import supabase from '../utils/supabase';
import { requestQueue } from './requestQueue';
import { logDelete } from './auditLog';

// Add debug logging
const DEBUG = true;

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DATABASE] ${message}`, data || '');
  }
};

class DatabaseManager {
  async init(): Promise<void> {
    // Test connection to Supabase
    try {
      log('Testing database connection...');
      const { data, error } = await supabase
        .from('sanitation_records')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        log('Database connection error:', error);
        throw error;
      }
      
      log('Database connection successful', { count: data });
    } catch (error) {
      log('Failed to connect to database:', error);
      throw error;
    }
  }

  async insertRecord(record: Omit<SanitationRecord, 'id'>): Promise<number> {
    log('Starting insertRecord...', { 
      plant: record.plant, 
      line: record.line, 
      area: record.area, 
      bagian: record.bagian 
    });
    
    const currentUserStr = localStorage.getItem('currentUser');
    let createdBy = 'anonymous';

    log('Raw currentUser from localStorage:', currentUserStr);

    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        log('Parsed currentUser:', currentUser);
        createdBy = currentUser.full_name || currentUser.username || 'anonymous';
        log('Using created_by:', { full_name: currentUser.full_name, username: currentUser.username, result: createdBy });
      } catch (error) {
        log('Error parsing currentUser:', error);
        log('Failed string:', currentUserStr);
        createdBy = 'anonymous';
      }
    } else {
      log('No currentUser in localStorage!');
    }

    log('Final created_by value:', createdBy);

    const dbRecord: any = {
      plant: record.plant,
      line: record.line,
      tanggal: record.tanggal,
      area: record.area,
      bagian: record.bagian,
      foto_sebelum: record.photoBeforeUri || null,
      foto_sesudah: record.photoAfterUri || null,
      keterangan: record.keterangan || '',
      status: record.status || 'completed',
      created_by: createdBy
    };

    // Add timestamps if they exist
    if (record.foto_sebelum_timestamp) {
      dbRecord.foto_sebelum_timestamp = record.foto_sebelum_timestamp;
    }
    if (record.foto_sesudah_timestamp) {
      dbRecord.foto_sesudah_timestamp = record.foto_sesudah_timestamp;
    }

    log('Attempting to insert record:', dbRecord);

    try {
      log('Calling supabase.from(sanitation_records).insert()...');

      // Check foto size before insert
      const beforeSize = dbRecord.foto_sebelum ? dbRecord.foto_sebelum.length : 0;
      const afterSize = dbRecord.foto_sesudah ? dbRecord.foto_sesudah.length : 0;
      log('Photo sizes:', {
        beforeKB: Math.round(beforeSize / 1024),
        afterKB: Math.round(afterSize / 1024)
      });

      const { data, error } = await supabase
        .from('sanitation_records')
        .insert(dbRecord)
        .select('id')
        .single();

      if (error) {
        log('Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      log('Record inserted successfully:', data);
      return data.id;
    } catch (error: any) {
      log('Database insert failed:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // If timestamp columns don't exist yet, try without them
      if (error.code === '42703') {
        log('Retrying without timestamp columns...');
        delete dbRecord.foto_sebelum_timestamp;
        delete dbRecord.foto_sesudah_timestamp;

        const { data, error: retryError } = await supabase
          .from('sanitation_records')
          .insert(dbRecord)
          .select('id')
          .single();

        if (retryError) {
          log('Retry insert error:', retryError);
          throw retryError;
        }
        
        log('Record inserted successfully on retry:', data);
        return data.id;
      }
      throw error;
    }
  }

  async getAllRecords(): Promise<SanitationRecord[]> {
    try {
      log('Fetching all records...');

      const { data, error } = await supabase
        .from('sanitation_records')
        .select('*')
        .order('tanggal', { ascending: false });

      if (error) {
        log('Get all records error:', error);
        throw error;
      }

      log('Records fetched successfully:', { count: data?.length || 0 });

      return (data || []).map(record => ({
        id: record.id,
        plant: record.plant,
        line: record.line,
        area: record.area,
        bagian: record.bagian,
        photoBeforeUri: record.foto_sebelum,
        photoAfterUri: record.foto_sesudah,
        foto_sebelum: record.foto_sebelum,
        foto_sebelum_timestamp: record.foto_sebelum_timestamp,
        foto_sesudah: record.foto_sesudah,
        foto_sesudah_timestamp: record.foto_sesudah_timestamp,
        keterangan: record.keterangan,
        tanggal: record.tanggal,
        createdAt: record.created_at,
        created_at: record.created_at,
        created_by: record.created_by,
        updated_at: record.updated_at,
        status: record.status as 'draft' | 'completed'
      }));
    } catch (error) {
      log('Failed to fetch records:', error);
      return [];
    }
  }

  async getRecordsMetadata(plant: string, line: string, tanggal: string): Promise<any[]> {
    try {
      log('Fetching records metadata:', { plant, line, tanggal });

      const { data, error } = await requestQueue.add(async () => {
        return await supabase
          .from('sanitation_records')
          .select('id, area, bagian, status, foto_sebelum_timestamp, foto_sesudah_timestamp')
          .eq('plant', plant)
          .eq('line', line)
          .eq('tanggal', tanggal)
          .order('created_at', { ascending: false });
      });

      if (error) {
        log('Get records metadata error:', error);
        throw error;
      }

      // Remove duplicates - keep only the latest record for each area+bagian combination
      const uniqueRecords = new Map();
      (data || []).forEach((record: any) => {
        const key = `${record.area}-${record.bagian}`;
        if (!uniqueRecords.has(key)) {
          uniqueRecords.set(key, record);
        }
      });

      const result = Array.from(uniqueRecords.values());
      log('Metadata fetched successfully (unique):', { count: result.length });
      return result;
    } catch (error) {
      log('Failed to fetch records metadata:', error);
      return [];
    }
  }

  async getRecordsByPlant(plant: string, status?: 'draft' | 'completed', limit?: number): Promise<SanitationRecord[]> {
    try {
      log('Fetching records by plant:', { plant, status, limit });

      let query = supabase
        .from('sanitation_records')
        .select('id, plant, line, area, bagian, keterangan, tanggal, created_at, created_by, updated_at, status, foto_sebelum_timestamp, foto_sesudah_timestamp')
        .eq('plant', plant)
        .order('tanggal', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.neq('status', 'draft');
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        log('Get records by plant error:', error);
        throw error;
      }

      log('Records fetched successfully:', { count: data?.length || 0 });

      return (data || []).map(record => ({
        id: record.id,
        plant: record.plant,
        line: record.line,
        area: record.area,
        bagian: record.bagian,
        photoBeforeUri: undefined,
        photoAfterUri: undefined,
        foto_sebelum: undefined,
        foto_sebelum_timestamp: record.foto_sebelum_timestamp,
        foto_sesudah: undefined,
        foto_sesudah_timestamp: record.foto_sesudah_timestamp,
        keterangan: record.keterangan,
        tanggal: record.tanggal,
        createdAt: record.created_at,
        created_at: record.created_at,
        created_by: record.created_by,
        updated_at: record.updated_at,
        status: record.status as 'draft' | 'completed'
      }));
    } catch (error) {
      log('Failed to fetch records by plant:', error);
      return [];
    }
  }

  async getRecordById(id: number): Promise<SanitationRecord | null> {
    try {
      log('Fetching record by id:', id);

      const { data, error } = await supabase
        .from('sanitation_records')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        log('Get record by id error:', error);
        throw error;
      }

      if (!data) {
        log('Record not found:', id);
        return null;
      }

      log('Record fetched successfully:', { id: data.id });

      return {
        id: data.id,
        plant: data.plant,
        line: data.line,
        area: data.area,
        bagian: data.bagian,
        photoBeforeUri: data.foto_sebelum,
        photoAfterUri: data.foto_sesudah,
        foto_sebelum: data.foto_sebelum,
        foto_sebelum_timestamp: data.foto_sebelum_timestamp,
        foto_sesudah: data.foto_sesudah,
        foto_sesudah_timestamp: data.foto_sesudah_timestamp,
        keterangan: data.keterangan,
        tanggal: data.tanggal,
        createdAt: data.created_at,
        created_at: data.created_at,
        created_by: data.created_by,
        updated_at: data.updated_at,
        status: data.status as 'draft' | 'completed'
      };
    } catch (error) {
      log('Failed to fetch record by id:', error);
      return null;
    }
  }

  async getRecordsByDate(date: string): Promise<SanitationRecord[]> {
    try {
      console.log('Fetching records for date:', date);
      
      const { data, error } = await supabase
        .from('sanitation_records')
        .select('*')
        .eq('tanggal', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get records by date error:', error);
        throw error;
      }

      console.log('Records fetched for date:', data?.length || 0, 'records');

      return (data || []).map(record => ({
        id: record.id,
        plant: record.plant,
        line: record.line,
        area: record.area,
        bagian: record.bagian,
        photoBeforeUri: record.foto_sebelum,
        photoAfterUri: record.foto_sesudah,
        foto_sebelum: record.foto_sebelum,
        foto_sebelum_timestamp: record.foto_sebelum_timestamp,
        foto_sesudah: record.foto_sesudah,
        foto_sesudah_timestamp: record.foto_sesudah_timestamp,
        keterangan: record.keterangan,
        tanggal: record.tanggal,
        createdAt: record.created_at,
        created_at: record.created_at,
        created_by: record.created_by,
        updated_at: record.updated_at,
        status: record.status as 'draft' | 'completed'
      }));
    } catch (error) {
      console.error('Failed to fetch records by date:', error);
      return [];
    }
  }

  async updateRecord(id: number, record: Partial<SanitationRecord>): Promise<void> {
    log('Starting updateRecord...', { id, hasData: !!record });
    
    const updateData: any = {};

    if (record.plant) updateData.plant = record.plant;
    if (record.line) updateData.line = record.line;
    if (record.tanggal) updateData.tanggal = record.tanggal;
    if (record.area) updateData.area = record.area;
    if (record.bagian) updateData.bagian = record.bagian;
    if (record.photoBeforeUri !== undefined) updateData.foto_sebelum = record.photoBeforeUri;
    if (record.photoAfterUri !== undefined) updateData.foto_sesudah = record.photoAfterUri;
    if (record.keterangan !== undefined) updateData.keterangan = record.keterangan;
    if (record.status) updateData.status = record.status;

    // Add timestamps if they exist
    if (record.foto_sebelum_timestamp !== undefined) {
      updateData.foto_sebelum_timestamp = record.foto_sebelum_timestamp;
    }
    if (record.foto_sesudah_timestamp !== undefined) {
      updateData.foto_sesudah_timestamp = record.foto_sesudah_timestamp;
    }

    log('Attempting to update record:', { id, updateData });

    try {
      log('Calling supabase.from(sanitation_records).update()...');

      // Check foto size before update
      const beforeSize = updateData.foto_sebelum ? updateData.foto_sebelum.length : 0;
      const afterSize = updateData.foto_sesudah ? updateData.foto_sesudah.length : 0;
      log('Photo sizes:', {
        beforeKB: Math.round(beforeSize / 1024),
        afterKB: Math.round(afterSize / 1024)
      });

      const { error } = await supabase
        .from('sanitation_records')
        .update(updateData)
        .eq('id', id);

      if (error) {
        log('Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      log('Record updated successfully');
    } catch (error: any) {
      log('Database update failed:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // If timestamp columns don't exist yet, try without them
      if (error.code === '42703') {
        log('Retrying update without timestamp columns...');
        delete updateData.foto_sebelum_timestamp;
        delete updateData.foto_sesudah_timestamp;

        const { error: retryError } = await supabase
          .from('sanitation_records')
          .update(updateData)
          .eq('id', id);

        if (retryError) {
          log('Retry update error:', retryError);
          throw retryError;
        }
        
        log('Record updated successfully on retry');
      } else {
        throw error;
      }
    }
  }

  async deleteRecord(id: number): Promise<void> {
    try {
      console.log('Attempting to delete record:', id);

      const record = await this.getRecordById(id);
      if (!record) {
        throw new Error('Record not found');
      }

      const currentUserStr = localStorage.getItem('currentUser');
      let deletedBy = 'anonymous';
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          deletedBy = currentUser.full_name || currentUser.username || 'anonymous';
        } catch (e) {
          console.error('Failed to parse currentUser:', e);
        }
      }

      await logDelete({
        table_name: 'sanitation_records',
        record_id: id.toString(),
        affected_count: 1,
        deleted_by: deletedBy,
        plant: record.plant,
        additional_info: {
          line: record.line,
          area: record.area,
          bagian: record.bagian,
          tanggal: record.tanggal
        }
      });

      const { error } = await supabase
        .from('sanitation_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Record deleted successfully');
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error;
    }
  }

  async checkRecordExists(plant: string, line: string, tanggal: string): Promise<boolean> {
    try {
      console.log('Checking if record exists:', { plant, line, tanggal });
      
      const { data, error } = await supabase
        .from('sanitation_records')
        .select('id')
        .eq('plant', plant)
        .eq('line', line)
        .eq('tanggal', tanggal)
        .maybeSingle();

      if (error) {
        console.error('Check record exists error:', error);
        throw error;
      }
      
      const exists = data !== null;
      console.log('Record exists:', exists);
      return exists;
    } catch (error) {
      console.error('Failed to check if record exists:', error);
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      console.log('Clearing all data...');
      
      const { error } = await supabase
        .from('sanitation_records')
        .delete()
        .neq('id', 0);

      if (error) {
        console.error('Clear all data error:', error);
        throw error;
      }
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Initialize database
export const initDatabase = () => dbManager.init();

// Export functions
export const insertRecord = (record: Omit<SanitationRecord, 'id'>) =>
  dbManager.insertRecord(record);

export const getAllRecords = () =>
  dbManager.getAllRecords();

export const getRecordsMetadata = (plant: string, line: string, tanggal: string) =>
  dbManager.getRecordsMetadata(plant, line, tanggal);

export const getRecordsByPlant = (plant: string, status?: 'draft' | 'completed', limit?: number) =>
  dbManager.getRecordsByPlant(plant, status, limit);

export const getRecordById = (id: number) =>
  dbManager.getRecordById(id);

export const getRecordsByDate = (date: string) =>
  dbManager.getRecordsByDate(date);

export const updateRecord = (id: number, record: Partial<SanitationRecord>) =>
  dbManager.updateRecord(id, record);

export const deleteRecord = (id: number) =>
  dbManager.deleteRecord(id);

export const checkRecordExists = (plant: string, line: string, tanggal: string) =>
  dbManager.checkRecordExists(plant, line, tanggal);

export const clearAllData = () =>
  dbManager.clearAllData();
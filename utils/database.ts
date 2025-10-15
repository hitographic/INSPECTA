import * as SQLite from 'expo-sqlite';
import { SanitationRecord } from '@/types/database';
import * as ImageManipulator from 'expo-image-manipulator';

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sanitation.db');
  }
  return db;
};

export const initDatabase = async () => {
  try {
    const database = await getDb();
    
    // Create simple sanitation_records table with all fields
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sanitation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant TEXT NOT NULL,
        line TEXT NOT NULL,
        area TEXT NOT NULL,
        bagian TEXT NOT NULL,
        photoBeforeUri TEXT,
        photoAfterUri TEXT,
        keterangan TEXT,
        tanggal TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export const processAndResizeImage = async (uri: string): Promise<string> => {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 150, height: 150 } }
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );
    
    return manipulatedImage.uri;
  } catch (error) {
    console.error('Image processing error:', error);
    return uri;
  }
};

// Check if record exists for plant/line/date
export const checkRecordExists = async (plant: string, line: string, tanggal: string): Promise<boolean> => {
  try {
    const database = await getDb();
    const result = await database.getFirstAsync(`
      SELECT id FROM sanitation_records 
      WHERE plant = ? AND line = ? AND tanggal = ?
    `, [plant, line, tanggal]);
    return result !== null;
  } catch (error) {
    console.error('Check record exists error:', error);
    return false;
  }
};

// Insert record
export const insertRecord = async (record: any) => {
  try {
    const database = await getDb();
    
    // Process images before saving
    const processedPhotoBefore = record.photoBeforeUri ? await processAndResizeImage(record.photoBeforeUri) : '';
    const processedPhotoAfter = record.photoAfterUri ? await processAndResizeImage(record.photoAfterUri) : '';
    
    const result = await database.runAsync(`
      INSERT INTO sanitation_records 
      (plant, line, area, bagian, photoBeforeUri, photoAfterUri, keterangan, tanggal, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.plant,
      record.line,
      record.area,
      record.bagian,
      processedPhotoBefore,
      processedPhotoAfter,
      record.keterangan,
      record.tanggal,
      record.createdAt || new Date().toISOString()
    ]);
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Insert record error:', error);
    throw error;
  }
};

// Get all records
export const getAllRecords = async (): Promise<any[]> => {
  try {
    const database = await getDb();
    const result = await database.getAllAsync(`
      SELECT * FROM sanitation_records
      ORDER BY createdAt DESC
    `);
    return result as any[];
  } catch (error) {
    console.error('Get all records error:', error);
    return [];
  }
};

// Get records by date
export const getRecordsByDate = async (date: string): Promise<any[]> => {
  try {
    const database = await getDb();
    const result = await database.getAllAsync(`
      SELECT * FROM sanitation_records
      WHERE tanggal = ?
      ORDER BY createdAt DESC
    `, [date]);
    return result as any[];
  } catch (error) {
    console.error('Get records by date error:', error);
    return [];
  }
};

// Update record
export const updateRecord = async (id: number, record: any) => {
  try {
    const database = await getDb();
    
    // Process images before updating
    const processedPhotoBefore = await processAndResizeImage(record.photoBeforeUri);
    const processedPhotoAfter = await processAndResizeImage(record.photoAfterUri);
    
    const result = await database.runAsync(`
      UPDATE sanitation_records 
      SET area = ?, bagian = ?, photoBeforeUri = ?, photoAfterUri = ?, keterangan = ?
      WHERE id = ?
    `, [
      record.area,
      record.bagian,
      processedPhotoBefore,
      processedPhotoAfter,
      record.keterangan,
      id
    ]);
    return result.changes > 0;
  } catch (error) {
    console.error('Update record error:', error);
    throw error;
  }
};

// Delete record
export const deleteRecord = async (id: number) => {
  try {
    const database = await getDb();
    const result = await database.runAsync(`
      DELETE FROM sanitation_records WHERE id = ?
    `, [id]);
    return result.changes > 0;
  } catch (error) {
    console.error('Delete record error:', error);
    throw error;
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    const database = await getDb();
    await database.runAsync('DELETE FROM sanitation_records');
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Clear data error:', error);
    throw error;
  }
};

// Get records count
export const getRecordsCount = async (): Promise<number> => {
  try {
    const database = await getDb();
    const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM sanitation_records');
    return (result as any)?.count || 0;
  } catch (error) {
    console.error('Get records count error:', error);
    return 0;
  }
};

// Get database info
export const getDatabaseInfo = async () => {
  try {
    const database = await getDb();
    const tables = await database.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const recordsCount = await getRecordsCount();
    
    return {
      tables,
      recordsCount,
      databasePath: 'sanitation.db'
    };
  } catch (error) {
    console.error('Get database info error:', error);
    return null;
  }
};

// Legacy functions for backward compatibility
export const getUserByNik = async (nik: string) => {
  return { id: 1, nik: '12345', password: 'admin', name: 'Admin User' };
};

export const getOrCreateSanitationRecord = async (userId: number, plant: string, line: string, tanggal: string) => {
  return 1; // Mock record ID
};

export const insertSanitationDetail = async (detail: any) => {
  return 1; // Mock detail ID
};

export const getSanitationRecordsWithStatus = async () => {
  const records = await getAllRecords();
  return records.map(record => ({
    ...record,
    total_details: 1,
    completed_details: 1
  }));
};
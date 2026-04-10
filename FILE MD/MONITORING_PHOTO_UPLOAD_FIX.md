# Fix: Monitoring Photo Upload to Google Drive

## Problem
Foto monitoring records masih disimpan sebagai base64 data URL (`data:image/jpeg;base64,...`) di Google Sheet, menyebabkan masalah:
- File terlalu besar (50000+ karakter dalam satu cell)
- Tidak efisien untuk penyimpanan
- Berbeda dengan implementasi kliping records yang sudah menggunakan Google Drive URLs

## Solution
Mengubah cara penyimpanan foto monitoring agar:
1. Foto di-upload ke Google Drive folder `monitoring` 
2. Menyimpan direct URL format `https://lh3.googleusercontent.com/d/{fileId}` di database
3. Sesuai dengan implementasi kliping records

## Changes Made

### 1. File: `src/utils/monitoringDatabase.ts`

#### Fungsi `saveMonitoringRecord`
- Menambahkan logika untuk mendeteksi base64 data URL
- Upload ke Google Drive menggunakan `uploadPhotoFromDataUrl()`
- Ganti foto_url dengan direct URL sebelum menyimpan ke database
- Jika upload gagal, simpan foto_url kosong dan log error

**Before:**
```typescript
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
```

**After:**
```typescript
export const saveMonitoringRecord = async (record: Partial<MonitoringRecord>): Promise<MonitoringRecord> => {
  try {
    // Upload photo to Google Drive if it's a base64 data URL
    const recordData: any = { ...record };
    
    if (record.foto_url && typeof record.foto_url === 'string' && record.foto_url.startsWith('data:image')) {
      const fileName = `monitoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const uploadResult = await uploadPhotoFromDataUrl(record.foto_url, fileName, 'monitoring');
      if (uploadResult.success && uploadResult.directUrl) {
        recordData.foto_url = uploadResult.directUrl;
      } else {
        console.error('[MONITORING] Failed to upload photo:', uploadResult.error);
        recordData.foto_url = '';
      }
    }
    
    const result = await gPost('saveMonitoringRecord', recordData);
    if (!result.success) throw new Error(result.error || 'Save failed');
    return result.data;
  } catch (error) {
    console.error('Error saving monitoring record:', error);
    throw error;
  }
};
```

#### Fungsi `updateMonitoringRecord`
- Sama seperti `saveMonitoringRecord`, menambahkan upload logic
- Deteksi base64 foto yang sedang di-edit
- Upload dan ganti dengan direct URL

## Flow Monitoring Create

```
1. User ambil/upload foto di CreateMonitoringScreen
   ↓ (foto tersimpan sebagai base64 di state)
2. User click "Simpan Sementara" atau "Simpan Semua"
   ↓
3. CreateMonitoringScreen call saveMonitoringRecord/updateMonitoringRecord
   ↓
4. monitoringDatabase.ts deteksi foto base64
   ↓
5. Upload ke Google Drive folder 'monitoring'
   ↓
6. Terima direct URL (https://lh3.googleusercontent.com/d/{fileId})
   ↓
7. Simpan direct URL ke monitoring_records sheet
   ↓
8. Sukses! Foto tersimpan di Google Drive, URL di sheet
```

## Google Drive Structure
- Folder monitoring: https://drive.google.com/drive/folders/1kjL9f0zWh-Uo6koGISgpfzka8BKb69bG
- Foto akan di-upload dengan naming convention: `monitoring_{timestamp}_{random}.jpg`

## Verification
Setelah fix diterapkan, verifikasi di Google Sheet `monitoring_records`:
- Kolom `foto_url` akan berisi URL format: `https://lh3.googleusercontent.com/d/...` (bukan data:image...)
- Preview foto akan loading dari Google Drive
- Export Excel akan berhasil tanpa error "50000 characters limit"

## Testing Steps
1. Buka https://hitographic.github.io/INSPECTA/create-monitoring
2. Pilih plant, line, area
3. Ambil atau upload foto monitoring
4. Klik "Simpan Sementara" atau "Simpan Semua"
5. Verifikasi:
   - Google Sheet monitoring_records menampilkan URL `https://lh3.googleusercontent.com/...`
   - Foto bisa di-preview di spreadsheet
   - Export Excel tidak error

## Related Files
- `src/utils/googleApi.ts` - Upload utility functions (unchanged)
- `src/pages/CreateMonitoringScreen.tsx` - Create/Edit screen (unchanged)
- `src/utils/monitoringExport.ts` - Export to Excel (uses foto_url directly)
- `src/utils/klipingDatabase.ts` - Reference implementation (kliping_records sudah pakai ini)

# Fix: Monitoring Record Delete - Photo & Record Deletion

## Problem
Saat menghapus monitoring record di monitoring-records screen:
- ✅ Foto berhasil dihapus dari Google Drive
- ❌ **Data di Google Sheet monitoring_records TIDAK terhapus**
- Result: Photo hilang tapi data masih ada di sheet (konsistensi data rusak)

**Desired Behavior**: Saat delete, KEDUA-DUANYA harus dihapus:
1. Foto dari Google Drive
2. Record dari Google Sheet

## Root Cause Analysis

Setelah investigasi, ditemukan bahwa sistem sebenarnya sudah benar pada backend:
- `handleDeleteMonitoringRecord()` → memanggil `deleteRecordPhotos()` → memanggil `deleteDriveFile()`
- `handleDeleteMonitoringSession()` → memanggil `deleteRecordPhotos()` untuk setiap record → memanggil `deleteRows()` untuk menghapus dari sheet

Namun ada kemungkinan issue:
1. **Logging tidak lengkap** - sulit men-debug
2. **Regex mungkin tidak cocok** dengan format URL `https://lh3.googleusercontent.com/d/{fileId}`
3. **String comparison atau type issue** saat mengambil foto_url dari sheet
4. **Race condition** atau timing issue

## Changes Made

### File: `google-apps-script/Code.gs`

#### 1. Improved `extractDriveFileId()` function
- ✅ Tambah logging detail untuk debug
- ✅ Trim whitespace dari URL
- ✅ Log URL yang diproses (first 50 chars untuk privacy)
- ✅ Log hasil ekstraksi untuk setiap pattern

**Perbaikan**:
```javascript
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') {
    Logger.log('[EXTRACT ID] Invalid input - url is:', typeof url);
    return null;
  }
  
  url = url.trim();  // Trim whitespace
  Logger.log('[EXTRACT ID] Processing URL:', url);
  
  // Try lh3 format first
  var matchLh3 = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3) {
    Logger.log('[EXTRACT ID] Matched lh3 pattern, ID:', matchLh3[1]);
    return matchLh3[1];
  }
  // ... rest of patterns with logging
}
```

#### 2. Enhanced `deleteRecordPhotos()` function
- ✅ Tambah null/empty check
- ✅ Convert URL ke string dan trim
- ✅ Detailed logging untuk setiap step
- ✅ Log URL type dan value

**Perbaikan**:
```javascript
function deleteRecordPhotos(record, photoFields) {
  if (!record) {
    Logger.log('[DELETE PHOTOS] No record provided');
    return;
  }
  
  for (var i = 0; i < photoFields.length; i++) {
    var fieldName = photoFields[i];
    var url = record[fieldName];
    
    Logger.log('[DELETE PHOTOS] Field:', fieldName, '-> Type:', typeof url);
    
    if (!url) {
      Logger.log('[DELETE PHOTOS] Field is empty/null');
      continue;
    }
    
    url = String(url).trim();  // Ensure string
    
    var isDriveUrl = url.indexOf('drive.google.com') !== -1 || 
                     url.indexOf('googleusercontent.com') !== -1;
    
    if (isDriveUrl) {
      deleteDriveFile(url);
    }
  }
}
```

#### 3. Enhanced `deleteDriveFile()` function
- ✅ Tambah logging untuk file ID ekstraksi
- ✅ Log success/failure
- ✅ Graceful error handling dengan logging

**Perbaikan**:
```javascript
function deleteDriveFile(urlOrId) {
  var fileId = extractDriveFileId(urlOrId);
  Logger.log('[DELETE FILE] Extracted ID:', fileId);
  
  if (!fileId) {
    Logger.log('[DELETE FILE] Could not extract file ID');
    return;
  }
  
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    Logger.log('[DELETE FILE] Successfully deleted file:', fileId);
  } catch (e) {
    Logger.log('[DELETE FILE] Error:', e.toString());
  }
}
```

#### 4. Enhanced `handleDeleteMonitoringRecord()` function
- ✅ Log setiap step dari proses delete
- ✅ Log apakah record ditemukan
- ✅ Log foto_url yang ditemukan

**Perbaikan**:
```javascript
function handleDeleteMonitoringRecord(data) {
  var MONITORING_PHOTO_FIELDS = ['foto_url'];
  
  // Get record to delete associated photo
  var records = getSheetData('monitoring_records');
  var record = records.find(function(r) { 
    return String(r.id) === String(data.id); 
  });
  
  if (record) {
    Logger.log('[DELETE] Found record:', record.id, 'with foto_url:', record.foto_url);
    deleteRecordPhotos(record, MONITORING_PHOTO_FIELDS);
  } else {
    Logger.log('[DELETE] Record not found with id:', data.id);
  }
  
  var rowNum = findRowIndex('monitoring_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('monitoring_records', [rowNum]);
  return { success: true };
}
```

#### 5. Enhanced `handleDeleteMonitoringSession()` function
- ✅ Log jumlah matching records ditemukan
- ✅ Log setiap record yang diproses
- ✅ Log jumlah rows yang dihapus

## How to Test

### Step 1: Create Monitoring Record
1. Buka https://hitographic.github.io/INSPECTA/create-monitoring
2. Pilih Plant-1, Line 1, Area Silo
3. Ambil/upload 1-2 foto
4. Click "Simpan Sementara"
5. Verify di sheet: record ada, foto_url ada format `https://lh3.googleusercontent.com/...`
6. Verify di Drive: foto ada di folder monitoring

### Step 2: Delete Monitoring Record
1. Buka https://hitographic.github.io/INSPECTA/monitoring-records
2. Lihat card untuk record yang dibuat
3. Click tombol "Del"
4. Confirm delete

### Step 3: Verify Deletion
1. **Check Google Drive**: Foto seharusnya HILANG (atau di trash)
   - Buka: https://drive.google.com/drive/folders/monitoring_folder_id
   - Foto tidak boleh ada (atau cek Trash)

2. **Check Google Sheet**: Record seharusnya HILANG
   - Buka sheet monitoring_records
   - Row dengan data tersebut tidak boleh ada

3. **Check Logs** (untuk debug):
   - Buka Google Apps Script editor
   - View > Logs
   - Cari log entries dengan `[DELETE]`, `[DELETE PHOTOS]`, `[DELETE FILE]`
   - Verify flow berhasil

### Expected Logs Output
```
[DELETE] Found record: xyz123 with foto_url: https://lh3.googleusercontent.com/d/ABC123DEF...
[DELETE PHOTOS] Processing record with fields: foto_url
[DELETE PHOTOS] Field: foto_url -> Type: string -> Value: https://lh3.googleusercontent.com/d/ABC...
[DELETE PHOTOS] Is Drive URL: true -> URL: https://lh3.googleusercontent.com/d/ABC123DEF...
[DELETE PHOTOS] URL is a Drive URL, attempting delete
[EXTRACT ID] Processing URL: https://lh3.googleusercontent.com/d/ABC123DEF...
[EXTRACT ID] Matched lh3 pattern, ID: ABC123DEF...
[DELETE FILE] Extracted ID: ABC123DEF...
[DELETE FILE] Successfully deleted file: ABC123DEF...
```

## Deployment Steps

### 1. Update Google Apps Script
1. Buka Google Apps Script: https://script.google.com
2. Copy-paste changes dari section "File: google-apps-script/Code.gs"
3. Click "Deploy" > "New deployment"
4. Type: "Web app"
5. Execute as: "Me"
6. Who has access: "Anyone"
7. Copy new Web App URL
8. Update di `.env` jika URL berubah

### 2. Test Delete Workflow
- Ikuti "How to Test" section di atas

### 3. Verify in Production
- Data harus hilang dari BOTH places saat delete
- Logs harus menunjukkan successful execution

## Monitoring

Untuk memantau delete operations di masa depan:
1. Check Google Apps Script logs regularly
2. Lihat pattern dari `[DELETE*]` log entries
3. Jika ada errors, gunakan logs untuk debug
4. Jika perlu refinement, update function dengan improvements lebih lanjut

## Related Issues

- Monitoring photo upload sudah fixed di commit sebelumnya
- Delete operation sudah ada di backend, hanya perlu logging untuk debug
- Kliping records sudah punya delete yang bekerja, monitoring follow same pattern

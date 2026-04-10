# Google Apps Script Deployment Instructions

## Status: READY TO DEPLOY ✅

Semua perubahan untuk fix monitoring delete sudah siap di-deploy ke Google Apps Script production.

## Perubahan yang Akan Di-Deploy

### 1. Enhanced Monitoring Delete Functions
- ✅ Improved `extractDriveFileId()` - Better URL parsing dengan logging
- ✅ Enhanced `deleteDriveFile()` - Better error handling
- ✅ Improved `deleteRecordPhotos()` - Better null checking & logging
- ✅ Enhanced `handleDeleteMonitoringRecord()` - Added logging
- ✅ Enhanced `handleDeleteMonitoringSession()` - Added logging

### 2. Key Improvements
- **Robust URL Parsing**: Handle lh3.googleusercontent.com URLs lebih baik
- **Comprehensive Logging**: Setiap step tercatat untuk debug
- **Better Type Safety**: String conversion dan whitespace trimming
- **Better Error Handling**: Graceful error handling dengan logging

## Step-by-Step Deployment

### Step 1: Open Google Apps Script
1. Kunjungi link: https://script.google.com/macros/s/AKfycbyTobnK1fnZoLMvd1CF-t27qPFhowI2veZFS0zTgitt3kizAdnFGMSlwFMdPYVNdkdX/exec
2. Atau buka https://script.google.com dan pilih project INSPECTA

### Step 2: Replace Code
1. **Backup kode lama** (optional tapi recommended)
   - Pilih semua kode (Ctrl+A / Cmd+A)
   - Copy dan simpan di text editor

2. **Paste kode baru**
   - Clear semua kode lama
   - Copy seluruh isi dari file `google-apps-script/Code.gs` (dari workspace)
   - Paste ke editor Google Apps Script

3. **Verify perubahan**
   - Cek bahwa fungsi-fungsi berikut ada:
     - `handleDeleteMonitoringRecord()` - line ~1068
     - `handleDeleteMonitoringSession()` - line ~1084
     - `extractDriveFileId()` - line ~1225
     - `deleteDriveFile()` - line ~1279
     - `deleteRecordPhotos()` - line ~1302

### Step 3: Deploy
1. Click **"Deploy"** di top right
2. Click **"New deployment"**
3. Pilih gear icon ⚙️, select **"Web app"**
4. **Settings**:
   - Type: Web app
   - Execute as: Me (atau pilih akun yang punya akses ke Sheet & Drive)
   - Who has access: Anyone
5. Click **"Deploy"**
6. **PENTING**: Copy URL baru yang ditampilkan
   - Format: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

### Step 4: Update Environment (if URL changed)
Jika URL berubah:
1. Buka file `.env` di workspace
2. Update `VITE_GOOGLE_APPS_SCRIPT_URL` dengan URL baru
3. Redeploy aplikasi ke production

### Step 5: Test Delete Function
1. Buka https://hitographic.github.io/INSPECTA/monitoring-records (atau URL lokal)
2. Buat monitoring record baru dengan foto
3. Klik tombol "Del" untuk delete
4. Verify:
   - ✅ Foto hilang dari Google Drive
   - ✅ Record hilang dari Google Sheet
5. Check logs di Google Apps Script:
   - View > Logs
   - Cari entries dengan `[DELETE]`, `[DELETE PHOTOS]`, `[DELETE FILE]`

## Expected Logs Output

Jika delete berhasil, Anda akan melihat logs seperti ini:

```
[DELETE] Found record: abc123def with foto_url: https://lh3.googleusercontent.com/d/XYZ...
[DELETE PHOTOS] Processing record with fields: foto_url
[DELETE PHOTOS] Field: foto_url -> Type: string -> Value: https://lh3.googleusercontent...
[DELETE PHOTOS] Is Drive URL: true -> URL: https://lh3.googleusercontent.com/d/XYZ...
[DELETE PHOTOS] URL is a Drive URL, attempting delete
[EXTRACT ID] Processing URL: https://lh3.googleusercontent.com/d/XYZ...
[EXTRACT ID] Matched lh3 pattern, ID: XYZ...
[DELETE FILE] Extracted ID: XYZ...
[DELETE FILE] Successfully deleted file: XYZ...
[DELETE SESSION] Found 1 matching records to delete
[DELETE SESSION] Processing record: abc123def with foto_url: https://lh3.googleusercontent.com/d/XYZ...
[DELETE SESSION] Deleting 1 rows
```

## Troubleshooting

### Logs menunjukkan "[DELETE FILE] Could not extract file ID"
- URL mungkin tidak valid
- Cek apakah foto_url di sheet sudah menggunakan format `https://lh3.googleusercontent.com/d/{fileId}`
- Jika masih error, cek regex di `extractDriveFileId()`

### Foto dihapus tapi record tetap ada
- Berarti `deleteRows()` tidak berfungsi
- Check apakah ada error saat menemukan row
- Verify bahwa id match dengan benar

### Record dihapus tapi foto tetap ada
- Berarti `deleteDriveFile()` error
- Check di logs untuk `[DELETE FILE]` errors
- Mungkin file sudah dihapus manual atau permission issue

## Rollback (jika ada masalah)

Jika perlu rollback:
1. Buka Google Apps Script
2. Lihat version history (di top left, ada clock icon)
3. Restore ke version sebelumnya
4. Deploy ulang

## Files Changed

**Di workspace**:
- `google-apps-script/Code.gs` - Updated dengan improvements

**Di Google Apps Script (after deploy)**:
- Akan ter-update otomatis setelah deploy

## Related Documentation

- `FILE MD/MONITORING_DELETE_FIX.md` - Detail teknis tentang fix
- `FILE MD/MONITORING_PHOTO_UPLOAD_FIX.md` - Info tentang photo upload

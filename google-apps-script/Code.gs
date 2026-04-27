/**
 * INSPECTA - Google Apps Script Backend
 * 
 * Deploy as Web App:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Copy-paste this code
 * 3. Deploy > New deployment > Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy the Web App URL
 * 
 * SETUP:
 * - Set SPREADSHEET_ID to your Google Sheet ID
 * - Set DRIVE_FOLDER_ID to your Google Drive folder ID
 */

const SPREADSHEET_ID = '1lUiErGiafpnFV4OsCGZwytTMiOIsBbMvkX_FDd2GWX4';
const DRIVE_FOLDER_ID = '1w4aVxlfSxRAPRGEojRTFOWM9JKUFnnj_';

// ===== CORS & REQUEST HANDLING =====

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;
    
    let postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        // If not JSON, try form data
        postData = e.postData.contents;
      }
    }
    
    let result;
    
    switch (action) {
      // AUTH
      case 'login':
        result = handleLogin(postData);
        break;
      case 'getUsers':
        result = handleGetUsers();
        break;
      case 'createUser':
        result = handleCreateUser(postData);
        break;
      case 'updateUser':
        result = handleUpdateUser(postData);
        break;
      case 'deleteUser':
        result = handleDeleteUser(postData);
        break;
      case 'getPermissionDefinitions':
        result = handleGetPermissionDefinitions();
        break;
      case 'getUserPermissions':
        result = handleGetUserPermissions(postData);
        break;
        
      // SANITATION RECORDS
      case 'getSanitationRecords':
        result = handleGetSanitationRecords(params);
        break;
      case 'getSanitationRecordById':
        result = handleGetSanitationRecordById(params);
        break;
      case 'insertSanitationRecord':
        result = handleInsertSanitationRecord(postData);
        break;
      case 'updateSanitationRecord':
        result = handleUpdateSanitationRecord(postData);
        break;
      case 'deleteSanitationRecord':
        result = handleDeleteSanitationRecord(postData);
        break;
      case 'getSanitationRecordsMetadata':
        result = handleGetSanitationRecordsMetadata(params);
        break;
        
      // KLIPING RECORDS
      case 'getKlipingRecords':
        result = handleGetKlipingRecords(params);
        break;
      case 'getKlipingRecordById':
        result = handleGetKlipingRecordById(params);
        break;
      case 'getKlipingRecordPhotos':
        result = handleGetKlipingRecordPhotos(params);
        break;
      case 'insertKlipingRecord':
        result = handleInsertKlipingRecord(postData);
        break;
      case 'updateKlipingRecord':
        result = handleUpdateKlipingRecord(postData);
        break;
      case 'deleteKlipingRecord':
        result = handleDeleteKlipingRecord(postData);
        break;
      case 'deleteKlipingByIdUnik':
        result = handleDeleteKlipingByIdUnik(postData);
        break;
      case 'countKlipingPhotos':
        result = handleCountKlipingPhotos(params);
        break;
        
      // MONITORING RECORDS
      case 'getMonitoringRecords':
        result = handleGetMonitoringRecords(params);
        break;
      case 'getMonitoringRecordsWithPhotos':
        result = handleGetMonitoringRecordsWithPhotos(params);
        break;
      case 'saveMonitoringRecord':
        result = handleSaveMonitoringRecord(postData);
        break;
      case 'updateMonitoringRecord':
        result = handleUpdateMonitoringRecord(postData);
        break;
      case 'deleteMonitoringRecord':
        result = handleDeleteMonitoringRecord(postData);
        break;
      case 'deleteMonitoringSession':
        result = handleDeleteMonitoringSession(postData);
        break;
      case 'deleteMultipleMonitoringRecords':
        result = handleDeleteMultipleMonitoringRecords(postData);
        break;
      case 'updateMonitoringSessionStatus':
        result = handleUpdateMonitoringSessionStatus(postData);
        break;
        
      // MASTER DATA
      case 'getAreas':
        result = handleGetAreas();
        break;
      case 'getBagianByArea':
        result = handleGetBagianByArea(params);
        break;
      case 'getBagianByAreaName':
        result = handleGetBagianByAreaName(params);
        break;
      case 'getBagianForLine':
        result = handleGetBagianForLine(params);
        break;
      case 'getLineConfiguration':
        result = handleGetLineConfiguration(params);
        break;
      case 'getAllLinesByPlant':
        result = handleGetAllLinesByPlant(params);
        break;
      case 'getSupervisors':
        result = handleGetSupervisors(params);
        break;
        
      // AUDIT LOGS
      case 'logDelete':
        result = handleLogDelete(postData);
        break;
      case 'getAuditLogs':
        result = handleGetAuditLogs(params);
        break;
        
      // PHOTO UPLOAD
      case 'uploadPhoto':
        result = handleUploadPhoto(postData);
        break;
      case 'getPhotoUrl':
        result = handleGetPhotoUrl(params);
        break;
      case 'getPhotoBase64':
        result = handleGetPhotoBase64(params);
        break;
      
      // BATCH OPERATIONS
      case 'batchUpdateSanitationStatus':
        result = handleBatchUpdateSanitationStatus(postData);
        break;

      // ===== GENERIC CRUD (for MasterDataManagement, updateStatus, etc.) =====
      case 'get':
        result = handleGenericGet(params);
        break;
      case 'insert':
        result = handleGenericInsert(postData);
        break;
      case 'update':
        result = handleGenericUpdate(postData);
        break;
      case 'delete':
        result = handleGenericDelete(postData);
        break;
        
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== UTILITY FUNCTIONS =====

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  // Detect which columns are date-like (tanggal, deleted_at, created_at, updated_at, etc.)
  const DATE_COLUMNS = ['tanggal'];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      var val = data[i][j];
      // Normalize date columns to yyyy-MM-dd
      if (DATE_COLUMNS.indexOf(headers[j]) !== -1 && val) {
        val = normalizeDate(val);
      }
      row[headers[j]] = val;
    }
    rows.push(row);
  }
  
  return rows;
}

/**
 * Normalize any date value to yyyy-MM-dd string.
 * Handles: Date objects, ISO strings (2026-03-03T17:00:00.000Z), and yyyy-MM-dd strings.
 */
function normalizeDate(val) {
  if (!val) return '';
  // If it's already yyyy-MM-dd, return as-is
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  // If it's a Date object (Google Sheets returns Date objects for date cells)
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  // If it's an ISO string like "2026-03-03T17:00:00.000Z"
  if (typeof val === 'string' && val.indexOf('T') !== -1) {
    // Parse and use UTC date to avoid timezone shifts
    var dt = new Date(val);
    if (!isNaN(dt.getTime())) {
      // Use the date portion directly from the ISO string to avoid timezone issues
      var parts = val.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
        return parts;
      }
      var y2 = dt.getUTCFullYear();
      var m2 = String(dt.getUTCMonth() + 1).padStart(2, '0');
      var d2 = String(dt.getUTCDate()).padStart(2, '0');
      return y2 + '-' + m2 + '-' + d2;
    }
  }
  return String(val);
}

function getSheetHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return data.length > 0 ? data[0] : [];
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // DEBUG: Log what we're about to insert
  Logger.log('[APPEND ROW] Sheet: ' + sheetName);
  Logger.log('[APPEND ROW] Headers: ' + headers.join(', '));
  
  const row = headers.map(h => {
    var val = rowData[h] !== undefined ? rowData[h] : '';
    
    // DEBUG: Log each field
    if (h === 'line_numbers') {
      Logger.log('[APPEND ROW] Processing line_numbers - type: ' + typeof val + ', isArray: ' + Array.isArray(val) + ', value: ' + JSON.stringify(val));
    }
    
    // Convert arrays to JSON string so Google Sheets stores them properly
    if (Array.isArray(val)) {
      Logger.log('[APPEND ROW] Converting array to JSON for field: ' + h);
      val = JSON.stringify(val);
      Logger.log('[APPEND ROW] After stringify: ' + val);
    }
    return val;
  });
  
  Logger.log('[APPEND ROW] Final row: ' + JSON.stringify(row));
  sheet.appendRow(row);
}

function findRowIndex(sheetName, columnName, value) {
  const sheet = getSheet(sheetName);
  if (!sheet) return -1;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return -1;
  
  // Normalize date columns for proper comparison
  const DATE_COLUMNS = ['tanggal'];
  const isDateCol = DATE_COLUMNS.indexOf(columnName) !== -1;
  const normalizedValue = isDateCol ? normalizeDate(value) : String(value);
  
  for (let i = 1; i < data.length; i++) {
    var cellVal = data[i][colIndex];
    var cellStr = isDateCol ? normalizeDate(cellVal) : String(cellVal);
    if (cellStr === normalizedValue) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

function findRowIndices(sheetName, filters) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const indices = [];
  
  // Normalize date columns for proper comparison
  const DATE_COLUMNS = ['tanggal'];
  
  for (let i = 1; i < data.length; i++) {
    let match = true;
    for (const [col, val] of Object.entries(filters)) {
      const colIndex = headers.indexOf(col);
      if (colIndex === -1) {
        match = false;
        break;
      }
      
      var cellVal = data[i][colIndex];
      var isDateCol = DATE_COLUMNS.indexOf(col) !== -1;
      var cellStr = isDateCol ? normalizeDate(cellVal) : String(cellVal);
      var filterStr = isDateCol ? normalizeDate(val) : String(val);
      
      if (cellStr !== filterStr) {
        match = false;
        break;
      }
    }
    if (match) indices.push(i + 1);
  }
  
  return indices;
}

function updateRow(sheetName, rowNumber, updates) {
  const sheet = getSheet(sheetName);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log('[UPDATE ROW] Sheet: ' + sheetName + ', Row: ' + rowNumber);
  Logger.log('[UPDATE ROW] Update keys: ' + Object.keys(updates).join(', '));
  
  for (const [key, value] of Object.entries(updates)) {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      // DEBUG: Log array handling
      if (key === 'line_numbers') {
        Logger.log('[UPDATE ROW] Processing line_numbers - type: ' + typeof value + ', isArray: ' + Array.isArray(value) + ', value: ' + JSON.stringify(value));
      }
      
      // Convert arrays to JSON string so Google Sheets stores them properly
      var cellValue = Array.isArray(value) ? JSON.stringify(value) : value;
      
      if (key === 'line_numbers') {
        Logger.log('[UPDATE ROW] Final cellValue for line_numbers: ' + cellValue);
      }
      
      sheet.getRange(rowNumber, colIndex + 1).setValue(cellValue);
    }
  }
}

function deleteRows(sheetName, rowNumbers) {
  const sheet = getSheet(sheetName);
  if (!sheet) return;
  
  // Delete from bottom to top to maintain row indices
  rowNumbers.sort((a, b) => b - a);
  for (const row of rowNumbers) {
    sheet.deleteRow(row);
  }
}

function generateUUID() {
  return Utilities.getUuid();
}

function nowISO() {
  return new Date().toISOString();
}

// ===== AUTH HANDLERS =====

function handleLogin(data) {
  const users = getSheetData('app_users');
  const user = users.find(u => 
    String(u.username) === String(data.username) && 
    String(u.password_hash) === String(data.password) &&
    (u.is_active === true || u.is_active === 'TRUE' || u.is_active === 'true')
  );
  
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Get permissions
  const allPermissions = getSheetData('user_permissions');
  const userPerms = allPermissions
    .filter(p => String(p.user_id) === String(user.id))
    .map(p => p.permission);
  
  // Parse JSON fields
  let allowedMenus = user.allowed_menus || '[]';
  let allowedPlants = user.allowed_plants || '[]';
  
  if (typeof allowedMenus === 'string') {
    try { allowedMenus = JSON.parse(allowedMenus); } catch(e) { allowedMenus = []; }
  }
  if (typeof allowedPlants === 'string') {
    try { allowedPlants = JSON.parse(allowedPlants); } catch(e) { allowedPlants = []; }
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_active: true,
      permissions: userPerms,
      allowed_menus: Array.isArray(allowedMenus) ? allowedMenus : [],
      allowed_plants: Array.isArray(allowedPlants) ? allowedPlants : []
    }
  };
}

function handleGetUsers() {
  const users = getSheetData('app_users');
  const allPermissions = getSheetData('user_permissions');
  
  return users.map(user => {
    const userPerms = allPermissions
      .filter(p => String(p.user_id) === String(user.id))
      .map(p => p.permission);
    
    let allowedMenus = user.allowed_menus || '[]';
    let allowedPlants = user.allowed_plants || '[]';
    
    if (typeof allowedMenus === 'string') {
      try { allowedMenus = JSON.parse(allowedMenus); } catch(e) { allowedMenus = []; }
    }
    if (typeof allowedPlants === 'string') {
      try { allowedPlants = JSON.parse(allowedPlants); } catch(e) { allowedPlants = []; }
    }
    
    return {
      ...user,
      is_active: user.is_active === true || user.is_active === 'TRUE' || user.is_active === 'true',
      permissions: userPerms,
      allowed_menus: Array.isArray(allowedMenus) ? allowedMenus : [],
      allowed_plants: Array.isArray(allowedPlants) ? allowedPlants : []
    };
  });
}

function handleCreateUser(data) {
  const id = generateUUID();
  const now = nowISO();
  
  appendRow('app_users', {
    username: data.username,
    password_hash: data.password,
    full_name: data.full_name,
    role: data.role,
    is_active: 'TRUE',
    created_at: now,
    updated_at: now,
    created_by: data.created_by || 'admin',
    allowed_menus: JSON.stringify(data.allowed_menus || []),
    allowed_plants: JSON.stringify(data.allowed_plants || []),
    id: id
  });
  
  // Add permissions
  if (data.permissions && data.permissions.length > 0) {
    for (const perm of data.permissions) {
      appendRow('user_permissions', {
        permission: perm,
        created_at: now,
        id: generateUUID(),
        user_id: id
      });
    }
  }
  
  return { success: true, id: id };
}

function handleUpdateUser(data) {
  const rowNum = findRowIndex('app_users', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'User not found' };
  
  const updates = { updated_at: nowISO() };
  if (data.full_name) updates.full_name = data.full_name;
  if (data.role) updates.role = data.role;
  if (data.is_active !== undefined) updates.is_active = data.is_active ? 'TRUE' : 'FALSE';
  if (data.allowed_menus !== undefined) updates.allowed_menus = JSON.stringify(data.allowed_menus);
  if (data.allowed_plants !== undefined) updates.allowed_plants = JSON.stringify(data.allowed_plants);
  
  updateRow('app_users', rowNum, updates);
  
  // Update permissions
  if (data.permissions) {
    // Delete old permissions
    const oldPerms = findRowIndices('user_permissions', { user_id: data.id });
    deleteRows('user_permissions', oldPerms);
    
    // Insert new permissions
    for (const perm of data.permissions) {
      appendRow('user_permissions', {
        permission: perm,
        created_at: nowISO(),
        id: generateUUID(),
        user_id: data.id
      });
    }
  }
  
  return { success: true };
}

function handleDeleteUser(data) {
  const rowNum = findRowIndex('app_users', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'User not found' };
  
  // Delete permissions first
  const permRows = findRowIndices('user_permissions', { user_id: data.id });
  deleteRows('user_permissions', permRows);
  
  // Delete user
  deleteRows('app_users', [rowNum]);
  
  return { success: true };
}

function handleGetPermissionDefinitions() {
  return getSheetData('permission_definitions');
}

function handleGetUserPermissions(data) {
  const users = getSheetData('app_users');
  const user = users.find(u => String(u.username) === String(data.username));
  if (!user) return [];
  
  const allPerms = getSheetData('user_permissions');
  return allPerms.filter(p => String(p.user_id) === String(user.id)).map(p => p.permission);
}

// ===== SANITATION RECORD HANDLERS =====

function handleGetSanitationRecords(params) {
  let records = getSheetData('sanitation_records');
  
  if (params.plant) records = records.filter(r => String(r.plant) === String(params.plant));
  if (params.line) records = records.filter(r => String(r.line) === String(params.line));
  if (params.tanggal) records = records.filter(r => String(r.tanggal) === String(params.tanggal));
  if (params.status) records = records.filter(r => String(r.status) === String(params.status));
  if (params.excludeStatus) records = records.filter(r => String(r.status) !== String(params.excludeStatus));
  
  // Sort by tanggal descending
  records.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  
  if (params.limit) records = records.slice(0, parseInt(params.limit));
  
  return records;
}

function handleGetSanitationRecordById(params) {
  const records = getSheetData('sanitation_records');
  return records.find(r => String(r.id) === String(params.id)) || null;
}

function handleInsertSanitationRecord(data) {
  const id = generateUUID();
  const now = nowISO();
  
  appendRow('sanitation_records', {
    plant: data.plant,
    line: data.line,
    tanggal: data.tanggal,
    area: data.area,
    bagian: data.bagian,
    foto_sebelum: data.foto_sebelum || '',
    foto_sesudah: data.foto_sesudah || '',
    keterangan: data.keterangan || '',
    status: data.status || 'completed',
    created_at: now,
    created_by: data.created_by || 'anonymous',
    updated_at: now,
    foto_sebelum_timestamp: data.foto_sebelum_timestamp || '',
    foto_sesudah_timestamp: data.foto_sesudah_timestamp || '',
    id: id
  });
  
  return { success: true, id: id };
}

function handleUpdateSanitationRecord(data) {
  const rowNum = findRowIndex('sanitation_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  const updates = { updated_at: nowISO() };
  const fields = ['plant', 'line', 'tanggal', 'area', 'bagian', 'foto_sebelum', 'foto_sesudah', 
                   'keterangan', 'status', 'foto_sebelum_timestamp', 'foto_sesudah_timestamp'];
  
  for (const f of fields) {
    if (data[f] !== undefined) updates[f] = data[f];
  }
  
  updateRow('sanitation_records', rowNum, updates);
  return { success: true };
}

function handleDeleteSanitationRecord(data) {
  var SANITATION_PHOTO_FIELDS = ['foto_sebelum', 'foto_sesudah'];
  
  // Get record to delete associated photos
  var records = getSheetData('sanitation_records');
  var record = records.find(function(r) { return String(r.id) === String(data.id); });
  if (record) {
    deleteRecordPhotos(record, SANITATION_PHOTO_FIELDS);
  }
  
  var rowNum = findRowIndex('sanitation_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('sanitation_records', [rowNum]);
  return { success: true };
}

function handleGetSanitationRecordsMetadata(params) {
  let records = getSheetData('sanitation_records');
  
  if (params.plant) records = records.filter(r => String(r.plant) === String(params.plant));
  if (params.line) records = records.filter(r => String(r.line) === String(params.line));
  if (params.tanggal) records = records.filter(r => String(r.tanggal) === String(params.tanggal));
  
  // Remove duplicates - keep latest for each area+bagian
  const uniqueMap = {};
  records.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  
  for (const r of records) {
    const key = r.area + '-' + r.bagian;
    if (!uniqueMap[key]) {
      uniqueMap[key] = {
        id: r.id,
        area: r.area,
        bagian: r.bagian,
        status: r.status,
        foto_sebelum_timestamp: r.foto_sebelum_timestamp,
        foto_sesudah_timestamp: r.foto_sesudah_timestamp
      };
    }
  }
  
  return Object.values(uniqueMap);
}

/**
 * Batch update status for multiple sanitation records in one call.
 * Expects data.ids (array of record IDs) and data.status (new status).
 * This is much faster than calling updateSanitationRecord N times.
 */
function handleBatchUpdateSanitationStatus(data) {
  try {
    var ids = data.ids;
    var newStatus = data.status || 'completed';
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: 'No record IDs provided' };
    }
    
    var sheet = getSheet('sanitation_records');
    if (!sheet) return { success: false, error: 'Sheet not found' };
    
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var idCol = headers.indexOf('id');
    var statusCol = headers.indexOf('status');
    var updatedAtCol = headers.indexOf('updated_at');
    
    if (idCol === -1 || statusCol === -1) {
      return { success: false, error: 'Required columns not found' };
    }
    
    var now = nowISO();
    var successCount = 0;
    var idSet = {};
    for (var i = 0; i < ids.length; i++) {
      idSet[String(ids[i])] = true;
    }
    
    // Update all matching rows in one pass
    for (var row = 1; row < allData.length; row++) {
      if (idSet[String(allData[row][idCol])]) {
        // Row in sheet is row+1 (1-indexed)
        sheet.getRange(row + 1, statusCol + 1).setValue(newStatus);
        if (updatedAtCol !== -1) {
          sheet.getRange(row + 1, updatedAtCol + 1).setValue(now);
        }
        successCount++;
      }
    }
    
    return { success: true, updatedCount: successCount, totalRequested: ids.length };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ===== KLIPING RECORD HANDLERS =====

function handleGetKlipingRecords(params) {
  let records = getSheetData('kliping_records');
  
  if (params.plant) records = records.filter(r => String(r.plant) === String(params.plant));
  if (params.startDate) records = records.filter(r => String(r.tanggal) >= params.startDate);
  if (params.endDate) records = records.filter(r => String(r.tanggal) <= params.endDate);
  if (params.line) records = records.filter(r => String(r.line) === String(params.line));
  if (params.regu) records = records.filter(r => String(r.regu) === String(params.regu));
  if (params.shift) records = records.filter(r => String(r.shift) === String(params.shift));
  
  // Select only metadata columns (not photo data) unless withPhotos=true
  if (params.withPhotos !== 'true') {
    records = records.map(r => ({
      id: r.id,
      id_unik: r.id_unik,
      plant: r.plant,
      tanggal: r.tanggal,
      line: r.line,
      regu: r.regu,
      shift: r.shift,
      flavor: r.flavor,
      pengamatan_ke: r.pengamatan_ke,
      mesin: r.mesin,
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
      is_complete: r.is_complete,
      pengamatan_timestamp: r.pengamatan_timestamp
    }));
  }
  
  records.sort((a, b) => {
    const dateCompare = String(b.tanggal).localeCompare(String(a.tanggal));
    if (dateCompare !== 0) return dateCompare;
    return String(b.created_at).localeCompare(String(a.created_at));
  });
  
  return records;
}

function handleGetKlipingRecordById(params) {
  const records = getSheetData('kliping_records');
  return records.find(r => String(r.id) === String(params.id)) || null;
}

function handleGetKlipingRecordPhotos(params) {
  const records = getSheetData('kliping_records');
  const record = records.find(r =>
    String(r.plant) === String(params.plant) &&
    String(r.tanggal) === String(params.tanggal) &&
    String(r.line) === String(params.line) &&
    String(r.regu) === String(params.regu) &&
    String(r.shift) === String(params.shift) &&
    String(r.pengamatan_ke) === String(params.pengamatan_ke) &&
    String(r.mesin) === String(params.mesin)
  );
  
  if (!record) return null;
  
  return {
    foto_etiket: record.foto_etiket,
    foto_banded: record.foto_banded,
    foto_karton: record.foto_karton,
    foto_label_etiket: record.foto_label_etiket,
    foto_label_bumbu: record.foto_label_bumbu,
    foto_label_minyak_bumbu: record.foto_label_minyak_bumbu,
    foto_label_si: record.foto_label_si,
    foto_label_opp_banded: record.foto_label_opp_banded
  };
}

function handleInsertKlipingRecord(data) {
  // Always check for exact duplicate by id_unik + mesin (prevent double-submit)
  var records = getSheetData('kliping_records');
  var existing = records.find(function(r) {
    return String(r.id_unik) === String(data.id_unik) &&
           String(r.mesin) === String(data.mesin) &&
           String(r.pengamatan_ke) === String(data.pengamatan_ke);
  });
  
  if (existing) {
    return { success: true, id: existing.id, skipped: true };
  }
  
  var id = generateUUID();
  var now = nowISO();
  
  appendRow('kliping_records', {
    id: id,
    plant: data.plant,
    tanggal: data.tanggal,
    line: data.line,
    regu: data.regu,
    shift: data.shift,
    id_unik: data.id_unik || '',
    pengamatan_ke: data.pengamatan_ke || '',
    flavor: data.flavor || '',
    mesin: data.mesin || '',
    foto_etiket: data.foto_etiket || '',
    foto_banded: data.foto_banded || '',
    foto_karton: data.foto_karton || '',
    foto_label_etiket: data.foto_label_etiket || '',
    foto_label_bumbu: data.foto_label_bumbu || '',
    foto_label_minyak_bumbu: data.foto_label_minyak_bumbu || '',
    foto_label_si: data.foto_label_si || '',
    foto_label_opp_banded: data.foto_label_opp_banded || '',
    created_by: data.created_by || 'anonymous',
    created_at: now,
    updated_at: now,
    is_complete: data.is_complete || false,
    pengamatan_timestamp: data.pengamatan_timestamp || ''
  });
  
  return { success: true, id: id };
}

function handleUpdateKlipingRecord(data) {
  const rowNum = findRowIndex('kliping_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  const updates = { updated_at: nowISO() };
  const fields = ['plant', 'tanggal', 'line', 'regu', 'shift', 'id_unik', 'pengamatan_ke',
                   'flavor', 'mesin', 'foto_etiket', 'foto_banded', 'foto_karton',
                   'foto_label_etiket', 'foto_label_bumbu', 'foto_label_minyak_bumbu',
                   'foto_label_si', 'foto_label_opp_banded', 'is_complete', 'pengamatan_timestamp'];
  
  for (const f of fields) {
    if (data[f] !== undefined) updates[f] = data[f];
  }
  
  updateRow('kliping_records', rowNum, updates);
  return { success: true };
}

function handleDeleteKlipingRecord(data) {
  var KLIPING_PHOTO_FIELDS = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
    'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
  
  // Get record first to delete associated photos
  var records = getSheetData('kliping_records');
  var record = records.find(function(r) { return String(r.id) === String(data.id); });
  if (record) {
    deleteRecordPhotos(record, KLIPING_PHOTO_FIELDS);
  }
  
  var rowNum = findRowIndex('kliping_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('kliping_records', [rowNum]);
  return { success: true };
}

function handleDeleteKlipingByIdUnik(data) {
  var KLIPING_PHOTO_FIELDS = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
    'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
  
  // Delete associated Drive photos first
  var allRecords = getSheetData('kliping_records');
  var matching = allRecords.filter(function(r) { return String(r.id_unik) === String(data.id_unik); });
  matching.forEach(function(record) {
    deleteRecordPhotos(record, KLIPING_PHOTO_FIELDS);
  });
  
  var rows = findRowIndices('kliping_records', { id_unik: data.id_unik });
  
  // If no records found, still return success (record may have been already deleted)
  if (rows.length === 0) {
    return { success: true, count: 0, note: 'No records found to delete (already deleted?)' };
  }
  
  deleteRows('kliping_records', rows);
  return { success: true, count: rows.length };
}

function handleCountKlipingPhotos(params) {
  let records = getSheetData('kliping_records');
  
  if (params.plant) records = records.filter(r => String(r.plant) === String(params.plant));
  
  const photoFields = ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
                        'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'];
  
  const counts = {};
  records.forEach(r => {
    const key = `${r.tanggal}_${r.line}_${r.regu}_${r.shift}_${r.pengamatan_ke}_${r.mesin}`;
    let count = 0;
    for (const f of photoFields) {
      if (r[f] && String(r[f]).trim() !== '') count++;
    }
    counts[key] = count;
  });
  
  return counts;
}

// ===== MONITORING RECORD HANDLERS =====

function handleGetMonitoringRecords(params) {
  let records = getSheetData('monitoring_records');
  
  if (params.plant) records = records.filter(r => String(r.plant) === String(params.plant));
  if (params.startDate) records = records.filter(r => String(r.tanggal) >= params.startDate);
  if (params.endDate) records = records.filter(r => String(r.tanggal) <= params.endDate);
  if (params.lines) {
    const lineList = params.lines.split(',');
    records = records.filter(r => lineList.includes(String(r.line)));
  }
  
  // Return without foto_url for list view
  records = records.map(r => ({
    ...r,
    foto_url: null
  }));
  
  records.sort((a, b) => {
    const dateCompare = String(b.tanggal).localeCompare(String(a.tanggal));
    if (dateCompare !== 0) return dateCompare;
    return Number(a.data_number) - Number(b.data_number);
  });
  
  return records;
}

function handleGetMonitoringRecordsWithPhotos(params) {
  let records = getSheetData('monitoring_records');
  
  records = records.filter(r =>
    String(r.plant) === String(params.plant) &&
    String(r.tanggal) === String(params.tanggal) &&
    String(r.line) === String(params.line)
  );
  
  records.sort((a, b) => Number(a.data_number) - Number(b.data_number));
  return records;
}

function handleSaveMonitoringRecord(data) {
  const id = generateUUID();
  const now = nowISO();
  
  appendRow('monitoring_records', {
    id: id,
    plant: data.plant,
    tanggal: data.tanggal,
    line: data.line,
    regu: data.regu || '',
    shift: data.shift || '',
    area: data.area,
    data_number: data.data_number,
    foto_url: data.foto_url || '',
    keterangan: data.keterangan || '',
    status: data.status || 'draft',
    created_by: data.created_by || 'anonymous',
    created_at: now,
    updated_at: now
  });
  
  return { success: true, id: id, data: { ...data, id: id, created_at: now, updated_at: now } };
}

function handleUpdateMonitoringRecord(data) {
  const rowNum = findRowIndex('monitoring_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  const updates = { updated_at: nowISO() };
  const fields = ['plant', 'tanggal', 'line', 'regu', 'shift', 'area', 'data_number',
                   'foto_url', 'keterangan', 'status'];
  
  for (const f of fields) {
    if (data[f] !== undefined) updates[f] = data[f];
  }
  
  updateRow('monitoring_records', rowNum, updates);
  
  // Return the updated record
  const record = getSheetData('monitoring_records').find(r => String(r.id) === String(data.id));
  return { success: true, data: record };
}

function handleDeleteMonitoringRecord(data) {
  var MONITORING_PHOTO_FIELDS = ['foto_url'];
  
  // Get record to delete associated photo
  var records = getSheetData('monitoring_records');
  var record = records.find(function(r) { return String(r.id) === String(data.id); });
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

function handleDeleteMonitoringSession(data) {
  var MONITORING_PHOTO_FIELDS = ['foto_url'];
  
  Logger.log('[DELETE SESSION] Input data - plant:', data.plant, 'tanggal:', data.tanggal, 'line:', data.line);
  
  // Delete associated photos
  var allRecords = getSheetData('monitoring_records');
  var matching = allRecords.filter(function(r) {
    return String(r.plant) === String(data.plant) && String(r.tanggal) === String(data.tanggal) && String(r.line) === String(data.line);
  });
  
  Logger.log('[DELETE SESSION] Found', matching.length, 'matching records (via getSheetData) to delete photos');
  matching.forEach(function(record) {
    Logger.log('[DELETE SESSION] Deleting photo for record:', record.id, 'foto_url:', record.foto_url);
    deleteRecordPhotos(record, MONITORING_PHOTO_FIELDS);
  });
  
  // Now find row indices to delete from sheet
  var filters = {
    plant: data.plant,
    tanggal: data.tanggal,
    line: data.line
  };
  Logger.log('[DELETE SESSION] Finding rows with filters:', JSON.stringify(filters));
  
  var rows = findRowIndices('monitoring_records', filters);
  
  Logger.log('[DELETE SESSION] Found', rows.length, 'rows to delete from sheet:', JSON.stringify(rows));
  
  if (rows.length === 0) {
    Logger.log('[DELETE SESSION] WARNING: No rows found! Checking raw sheet data for debugging...');
    // Debug: check raw values to see what's in the sheet
    var sheet = getSheet('monitoring_records');
    if (sheet) {
      var rawData = sheet.getDataRange().getValues();
      var headers = rawData[0];
      var plantCol = headers.indexOf('plant');
      var tanggalCol = headers.indexOf('tanggal');
      var lineCol = headers.indexOf('line');
      for (var i = 1; i < Math.min(rawData.length, 5); i++) {
        Logger.log('[DELETE SESSION DEBUG] Row', i+1, '- plant:', rawData[i][plantCol], 
          '(type:', typeof rawData[i][plantCol], ') tanggal:', rawData[i][tanggalCol],
          '(type:', typeof rawData[i][tanggalCol], ') line:', rawData[i][lineCol],
          '(type:', typeof rawData[i][lineCol], ')');
      }
    }
  }
  
  deleteRows('monitoring_records', rows);
  return { success: true, count: rows.length };
}

function handleDeleteMultipleMonitoringRecords(data) {
  var MONITORING_PHOTO_FIELDS = ['foto_url'];
  var ids = data.ids || [];
  var rows = [];
  
  // Delete associated photos
  var allRecords = getSheetData('monitoring_records');
  ids.forEach(function(id) {
    var record = allRecords.find(function(r) { return String(r.id) === String(id); });
    if (record) {
      deleteRecordPhotos(record, MONITORING_PHOTO_FIELDS);
    }
    var row = findRowIndex('monitoring_records', 'id', id);
    if (row !== -1) rows.push(row);
  });
  
  deleteRows('monitoring_records', rows);
  return { success: true, count: rows.length };
}

function handleUpdateMonitoringSessionStatus(data) {
  const allRecords = getSheetData('monitoring_records');
  const sheet = getSheet('monitoring_records');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const statusCol = headers.indexOf('status');
  const updatedAtCol = headers.indexOf('updated_at');
  
  const dataArr = sheet.getDataRange().getValues();
  const now = nowISO();
  
  for (let i = 1; i < dataArr.length; i++) {
    const plantIdx = headers.indexOf('plant');
    const tanggalIdx = headers.indexOf('tanggal');
    const lineIdx = headers.indexOf('line');
    const areaIdx = headers.indexOf('area');
    
    if (String(dataArr[i][plantIdx]) === String(data.plant) &&
        String(dataArr[i][tanggalIdx]) === String(data.tanggal) &&
        String(dataArr[i][lineIdx]) === String(data.line) &&
        String(dataArr[i][areaIdx]) === String(data.area)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(data.status);
      sheet.getRange(i + 1, updatedAtCol + 1).setValue(now);
    }
  }
  
  return { success: true };
}

// ===== MASTER DATA HANDLERS =====

function handleGetAreas() {
  const areas = getSheetData('sanitation_areas');
  areas.sort((a, b) => Number(a.display_order) - Number(b.display_order));
  return areas;
}

function handleGetBagianByArea(params) {
  let bagian = getSheetData('sanitation_bagian');
  bagian = bagian.filter(b => String(b.area_id) === String(params.areaId));
  bagian.sort((a, b) => Number(a.display_order) - Number(b.display_order));
  
  // Parse line_numbers
  return bagian.map(b => ({
    ...b,
    line_numbers: parseJsonField(b.line_numbers)
  }));
}

function handleGetBagianByAreaName(params) {
  const areas = getSheetData('sanitation_areas');
  const area = areas.find(a => a.name === params.areaName);
  if (!area) return [];
  
  let bagian = getSheetData('sanitation_bagian');
  bagian = bagian.filter(b => String(b.area_id) === String(area.id));
  bagian.sort((a, b) => Number(a.display_order) - Number(b.display_order));
  
  return bagian.map(b => ({
    ...b,
    line_numbers: parseJsonField(b.line_numbers)
  }));
}

function handleGetBagianForLine(params) {
  const lineNumber = params.lineNumber;
  const areas = getSheetData('sanitation_areas');
  const allBagian = getSheetData('sanitation_bagian');
  
  const grouped = {};
  
  for (const b of allBagian) {
    let lineNumbers = parseJsonField(b.line_numbers);
    
    if (Array.isArray(lineNumbers) && lineNumbers.includes(lineNumber)) {
      const area = areas.find(a => String(a.id) === String(b.area_id));
      const areaName = area ? area.name : 'Unknown';
      const areaOrder = area ? Number(area.display_order) : 999;
      
      if (!grouped[areaName]) {
        grouped[areaName] = { bagian: [], areaOrder };
      }
      
      grouped[areaName].bagian.push({
        ...b,
        line_numbers: lineNumbers
      });
    }
  }
  
  // Sort by area order and bagian display_order
  const result = {};
  Object.entries(grouped)
    .sort(([, a], [, b]) => a.areaOrder - b.areaOrder)
    .forEach(([name, data]) => {
      data.bagian.sort((a, b) => Number(a.display_order) - Number(b.display_order));
      result[name] = data.bagian;
    });
  
  return result;
}

function handleGetLineConfiguration(params) {
  const configs = getSheetData('line_configurations');
  return configs.find(c => 
    c.line_number === params.lineNumber && 
    (c.is_active === true || c.is_active === 'TRUE' || c.is_active === 'true')
  ) || null;
}

function handleGetAllLinesByPlant(params) {
  const configs = getSheetData('line_configurations');
  return configs
    .filter(c => c.plant === params.plant && (c.is_active === true || c.is_active === 'TRUE' || c.is_active === 'true'))
    .map(c => c.line_number)
    .sort();
}

function handleGetSupervisors(params) {
  let supervisors = getSheetData('supervisors');
  if (params.plant) {
    supervisors = supervisors.filter(s => s.plant === params.plant);
  }
  return supervisors;
}

function parseJsonField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch(e) { return []; }
  }
  return [];
}

// ===== AUDIT LOG HANDLERS =====

function handleLogDelete(data) {
  const id = generateUUID();
  const now = nowISO();
  
  appendRow('audit_logs', {
    id: id,
    table_name: data.table_name,
    record_id: data.record_id,
    deleted_by: data.deleted_by,
    deleted_at: now,
    action: data.action || 'DELETE',
    plant: data.plant || '',
    additional_info: JSON.stringify(data.additional_info || {}),
    created_at: now,
    affected_count: data.affected_count || 1
  });
  
  return { success: true };
}

function handleGetAuditLogs(params) {
  let logs = getSheetData('audit_logs');
  
  if (params.table_name) logs = logs.filter(l => l.table_name === params.table_name);
  if (params.deleted_by) logs = logs.filter(l => l.deleted_by === params.deleted_by);
  if (params.plant) logs = logs.filter(l => l.plant === params.plant);
  if (params.start_date) logs = logs.filter(l => String(l.deleted_at) >= params.start_date);
  if (params.end_date) logs = logs.filter(l => String(l.deleted_at) <= params.end_date);
  
  logs.sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)));
  
  if (params.limit) logs = logs.slice(0, parseInt(params.limit));
  
  return logs.map(l => ({
    ...l,
    additional_info: parseJsonField(l.additional_info)
  }));
}

// ===== PHOTO UPLOAD HANDLER =====

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') {
    Logger.log('[EXTRACT ID] Invalid input - url is:', typeof url);
    return null;
  }
  
  // Trim whitespace
  url = url.trim();
  Logger.log('[EXTRACT ID] Processing URL:', url);
  
  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  var matchLh3 = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3) {
    Logger.log('[EXTRACT ID] Matched lh3 pattern, ID:', matchLh3[1]);
    return matchLh3[1];
  }
  
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  var match1 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match1) {
    Logger.log('[EXTRACT ID] Matched query param pattern, ID:', match1[1]);
    return match1[1];
  }
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  var match2 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match2) {
    Logger.log('[EXTRACT ID] Matched /d/ pattern, ID:', match2[1]);
    return match2[1];
  }
  
  // Format: https://drive.google.com/thumbnail?id=FILE_ID
  var match3 = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (match3) {
    Logger.log('[EXTRACT ID] Matched thumbnail pattern, ID:', match3[1]);
    return match3[1];
  }
  
  // If it's a plain file ID (long alphanumeric string)
  if (url.length > 20 && !/[\/\:\.?&]/.test(url)) {
    Logger.log('[EXTRACT ID] Treating as plain file ID:', url);
    return url;
  }
  
  Logger.log('[EXTRACT ID] Could not extract ID from URL');
  return null;
}

/**
 * Delete a file from Google Drive by URL or file ID. Silently fails if file not found.
 */
function deleteDriveFile(urlOrId) {
  var fileId = extractDriveFileId(urlOrId);
  Logger.log('[DELETE FILE] URL/ID input:', urlOrId, '-> Extracted ID:', fileId);
  if (!fileId) {
    Logger.log('[DELETE FILE] Could not extract file ID');
    return;
  }
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    Logger.log('[DELETE FILE] Successfully deleted file:', fileId);
  } catch (e) {
    // File may already be deleted or not accessible - silently ignore
    Logger.log('Could not delete Drive file ' + fileId + ': ' + e.toString());
  }
}

/**
 * Delete all photo files associated with a record from Google Drive
 */
function deleteRecordPhotos(record, photoFields) {
  if (!record) {
    Logger.log('[DELETE PHOTOS] No record provided');
    return;
  }
  Logger.log('[DELETE PHOTOS] Processing record with fields:', photoFields);
  for (var i = 0; i < photoFields.length; i++) {
    var fieldName = photoFields[i];
    var url = record[fieldName];
    
    Logger.log('[DELETE PHOTOS] Field:', fieldName, '-> Type:', typeof url, '-> Value:', String(url).substring(0, 50));
    
    // Check if URL exists and is a Drive URL
    if (!url) {
      Logger.log('[DELETE PHOTOS] Field is empty/null');
      continue;
    }
    
    url = String(url).trim();
    
    // Check if it's a Drive URL
    var isDriveUrl = url.indexOf('drive.google.com') !== -1 || url.indexOf('googleusercontent.com') !== -1;
    Logger.log('[DELETE PHOTOS] Is Drive URL:', isDriveUrl, '-> URL:', url);
    
    if (isDriveUrl) {
      Logger.log('[DELETE PHOTOS] URL is a Drive URL, attempting delete');
      deleteDriveFile(url);
    } else {
      Logger.log('[DELETE PHOTOS] URL is not a Drive URL or empty');
    }
  }
}

function handleUploadPhoto(data) {
  try {
    // data.photo = base64 string (without data:image prefix)
    // data.fileName = desired file name
    // data.folder = subfolder name (e.g., 'sanitation', 'kliping', 'monitoring')
    
    const parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Get or create subfolder
    let targetFolder;
    const subfolderName = data.folder || 'photos';
    const subfolders = parentFolder.getFoldersByName(subfolderName);
    
    if (subfolders.hasNext()) {
      targetFolder = subfolders.next();
    } else {
      targetFolder = parentFolder.createFolder(subfolderName);
    }
    
    // Decode base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.photo),
      data.mimeType || 'image/jpeg',
      data.fileName || ('photo_' + Date.now() + '.jpg')
    );
    
    // Upload to Drive with retry logic
    let file = null;
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        file = targetFolder.createFile(blob);
        break; // Success
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          console.warn('Upload attempt ' + attempt + '/3 failed, retrying...: ' + err);
          // Wait before retrying (exponential backoff)
          Utilities.sleep(1000 * attempt);
        }
      }
    }
    
    if (!file) {
      return { success: false, error: 'Failed to upload after 3 attempts: ' + lastError };
    }
    
    // Make file accessible via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    var viewUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    return {
      success: true,
      fileId: fileId,
      viewUrl: viewUrl,
      directUrl: directUrl,
      fileName: file.getName()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function handleGetPhotoUrl(params) {
  try {
    const fileId = params.fileId;
    return {
      viewUrl: 'https://drive.google.com/file/d/' + fileId + '/view',
      directUrl: 'https://drive.google.com/uc?export=view&id=' + fileId
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Get photo as base64 from Google Drive. Used as a CORS proxy.
 * Accepts either a fileId or a full URL (lh3/drive).
 */
function handleGetPhotoBase64(params) {
  try {
    var fileId = params.fileId;
    // If a URL was passed instead of a file ID, extract the ID
    if (!fileId && params.url) {
      fileId = extractDriveFileId(params.url);
    }
    if (!fileId) return { error: 'Missing fileId or url' };
    
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var mimeType = blob.getContentType();
    var base64 = Utilities.base64Encode(blob.getBytes());
    
    return {
      success: true,
      base64: 'data:' + mimeType + ';base64,' + base64,
      mimeType: mimeType,
      fileName: file.getName()
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// ===== GENERIC CRUD HANDLERS =====
// Used by MasterDataManagement, updateStatus, monitoringExport, klipingExport, etc.

// Allowed tables for generic CRUD (security whitelist)
const ALLOWED_TABLES = [
  'sanitation_areas', 'sanitation_bagian', 'supervisors',
  'sanitation_records', 'kliping_records', 'monitoring_records',
  'app_users', 'user_permissions', 'permission_definitions',
  'audit_logs', 'line_configurations'
];

function handleGenericGet(params) {
  try {
    const table = params.table;
    if (!table || ALLOWED_TABLES.indexOf(table) === -1) {
      return { error: 'Invalid or missing table: ' + table };
    }
    
    const data = getSheetData(table);
    
    // If an id is requested, return single record
    if (params.id) {
      const record = data.find(function(r) { return String(r.id) === String(params.id); });
      return record || { error: 'Record not found' };
    }
    
    return data;
  } catch (error) {
    return { error: error.toString() };
  }
}

function handleGenericInsert(postData) {
  try {
    const table = postData.table;
    if (!table || ALLOWED_TABLES.indexOf(table) === -1) {
      return { error: 'Invalid or missing table: ' + table };
    }
    
    const data = postData.data || {};
    
    // DEBUG: Log incoming data to check line_numbers
    Logger.log('[INSERT] Table: ' + table);
    Logger.log('[INSERT] Data keys: ' + Object.keys(data).join(', '));
    if (data.line_numbers !== undefined) {
      Logger.log('[INSERT] line_numbers type: ' + typeof data.line_numbers);
      Logger.log('[INSERT] line_numbers isArray: ' + Array.isArray(data.line_numbers));
      Logger.log('[INSERT] line_numbers value: ' + JSON.stringify(data.line_numbers));
    }
    
    // Generate an id if not provided
    if (!data.id) {
      data.id = generateUUID();
    }
    
    // Add timestamps
    data.created_at = data.created_at || nowISO();
    data.updated_at = nowISO();
    
    appendRow(table, data);
    
    return { success: true, id: data.id, data: data };
  } catch (error) {
    Logger.log('[INSERT ERROR] ' + error.toString());
    return { error: error.toString() };
  }
}

function handleGenericUpdate(postData) {
  try {
    const table = postData.table;
    if (!table || ALLOWED_TABLES.indexOf(table) === -1) {
      return { error: 'Invalid or missing table: ' + table };
    }
    
    const id = postData.id;
    if (!id) return { error: 'Missing id' };
    
    const data = postData.data || {};
    data.updated_at = nowISO();
    
    const rowIndex = findRowIndex(table, 'id', id);
    if (rowIndex === -1) return { error: 'Record not found with id: ' + id };
    
    updateRow(table, rowIndex, data);
    
    return { success: true, id: id };
  } catch (error) {
    return { error: error.toString() };
  }
}

function handleGenericDelete(postData) {
  try {
    var table = postData.table;
    if (!table || ALLOWED_TABLES.indexOf(table) === -1) {
      return { error: 'Invalid or missing table: ' + table };
    }
    
    var id = postData.id;
    if (!id) return { error: 'Missing id' };
    
    // Delete associated Drive photos if applicable
    var PHOTO_FIELDS_MAP = {
      'kliping_records': ['foto_etiket', 'foto_banded', 'foto_karton', 'foto_label_etiket',
        'foto_label_bumbu', 'foto_label_minyak_bumbu', 'foto_label_si', 'foto_label_opp_banded'],
      'sanitation_records': ['foto_sebelum', 'foto_sesudah'],
      'monitoring_records': ['foto_url']
    };
    
    if (PHOTO_FIELDS_MAP[table]) {
      var allRecords = getSheetData(table);
      var record = allRecords.find(function(r) { return String(r.id) === String(id); });
      if (record) {
        deleteRecordPhotos(record, PHOTO_FIELDS_MAP[table]);
      }
    }
    
    var rowIndex = findRowIndex(table, 'id', id);
    if (rowIndex === -1) return { error: 'Record not found with id: ' + id };
    
    deleteRows(table, [rowIndex]);
    
    return { success: true, deleted: id };
  } catch (error) {
    return { error: error.toString() };
  }
}

// ===== TEST FUNCTION =====
// Run this from Google Apps Script Editor to test array handling
function testArrayInsert() {
  var testData = {
    table: 'sanitation_bagian',
    data: {
      area_id: 'test-area-id',
      name: 'TEST BAGIAN - DELETE ME',
      keterangan: 'Test untuk array',
      line_numbers: ["1", "2", "3", "4", "5"],
      display_order: 999
    }
  };
  
  Logger.log('=== TEST ARRAY INSERT ===');
  Logger.log('Input line_numbers: ' + JSON.stringify(testData.data.line_numbers));
  Logger.log('Is Array: ' + Array.isArray(testData.data.line_numbers));
  
  var result = handleGenericInsert(testData);
  Logger.log('Result: ' + JSON.stringify(result));
  
  // Check what was saved
  var sheet = getSheet('sanitation_bagian');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var lineNumCol = headers.indexOf('line_numbers');
  var lastRow = data[data.length - 1];
  
  Logger.log('Last row line_numbers value: ' + lastRow[lineNumCol]);
  Logger.log('Type: ' + typeof lastRow[lineNumCol]);
  
  return result;
}

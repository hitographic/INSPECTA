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
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  return rows;
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
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
  sheet.appendRow(row);
}

function findRowIndex(sheetName, columnName, value) {
  const sheet = getSheet(sheetName);
  if (!sheet) return -1;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return -1;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) {
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
  
  for (let i = 1; i < data.length; i++) {
    let match = true;
    for (const [col, val] of Object.entries(filters)) {
      const colIndex = headers.indexOf(col);
      if (colIndex === -1 || String(data[i][colIndex]) !== String(val)) {
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
  
  for (const [key, value] of Object.entries(updates)) {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      sheet.getRange(rowNumber, colIndex + 1).setValue(value);
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
  
  if (params.plant) records = records.filter(r => r.plant === params.plant);
  if (params.line) records = records.filter(r => r.line === params.line);
  if (params.tanggal) records = records.filter(r => String(r.tanggal) === String(params.tanggal));
  if (params.status) records = records.filter(r => r.status === params.status);
  if (params.excludeStatus) records = records.filter(r => r.status !== params.excludeStatus);
  
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
  const rowNum = findRowIndex('sanitation_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('sanitation_records', [rowNum]);
  return { success: true };
}

function handleGetSanitationRecordsMetadata(params) {
  let records = getSheetData('sanitation_records');
  
  if (params.plant) records = records.filter(r => r.plant === params.plant);
  if (params.line) records = records.filter(r => r.line === params.line);
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

// ===== KLIPING RECORD HANDLERS =====

function handleGetKlipingRecords(params) {
  let records = getSheetData('kliping_records');
  
  if (params.plant) records = records.filter(r => r.plant === params.plant);
  if (params.startDate) records = records.filter(r => String(r.tanggal) >= params.startDate);
  if (params.endDate) records = records.filter(r => String(r.tanggal) <= params.endDate);
  if (params.line) records = records.filter(r => r.line === params.line);
  if (params.regu) records = records.filter(r => r.regu === params.regu);
  if (params.shift) records = records.filter(r => r.shift === params.shift);
  
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
    r.plant === params.plant &&
    String(r.tanggal) === String(params.tanggal) &&
    r.line === params.line &&
    r.regu === params.regu &&
    r.shift === params.shift &&
    String(r.pengamatan_ke) === String(params.pengamatan_ke) &&
    r.mesin === params.mesin
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
  // Check duplicate
  if (!data.skipDuplicateCheck) {
    const records = getSheetData('kliping_records');
    const existing = records.find(r =>
      r.plant === data.plant &&
      String(r.tanggal) === String(data.tanggal) &&
      r.line === data.line &&
      r.regu === data.regu &&
      r.shift === data.shift &&
      r.id_unik === data.id_unik &&
      r.mesin === data.mesin
    );
    
    if (existing) {
      return { success: true, id: existing.id, skipped: true };
    }
  }
  
  const id = generateUUID();
  const now = nowISO();
  
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
  const rowNum = findRowIndex('kliping_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('kliping_records', [rowNum]);
  return { success: true };
}

function handleDeleteKlipingByIdUnik(data) {
  const rows = findRowIndices('kliping_records', { id_unik: data.id_unik });
  if (rows.length === 0) return { success: false, error: 'No records found' };
  
  deleteRows('kliping_records', rows);
  return { success: true, count: rows.length };
}

function handleCountKlipingPhotos(params) {
  let records = getSheetData('kliping_records');
  
  if (params.plant) records = records.filter(r => r.plant === params.plant);
  
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
  
  if (params.plant) records = records.filter(r => r.plant === params.plant);
  if (params.startDate) records = records.filter(r => String(r.tanggal) >= params.startDate);
  if (params.endDate) records = records.filter(r => String(r.tanggal) <= params.endDate);
  if (params.lines) {
    const lineList = params.lines.split(',');
    records = records.filter(r => lineList.includes(r.line));
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
    r.plant === params.plant &&
    String(r.tanggal) === String(params.tanggal) &&
    r.line === params.line
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
  const rowNum = findRowIndex('monitoring_records', 'id', data.id);
  if (rowNum === -1) return { success: false, error: 'Record not found' };
  
  deleteRows('monitoring_records', [rowNum]);
  return { success: true };
}

function handleDeleteMonitoringSession(data) {
  const rows = findRowIndices('monitoring_records', {
    plant: data.plant,
    tanggal: data.tanggal,
    line: data.line
  });
  
  deleteRows('monitoring_records', rows);
  return { success: true, count: rows.length };
}

function handleDeleteMultipleMonitoringRecords(data) {
  const ids = data.ids || [];
  const rows = [];
  
  for (const id of ids) {
    const row = findRowIndex('monitoring_records', 'id', id);
    if (row !== -1) rows.push(row);
  }
  
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
    
    // Upload to Drive
    const file = targetFolder.createFile(blob);
    
    // Make file accessible via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const viewUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    const directUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
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

export interface CSVUserData {
  nik: string;
  password: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
  menus: string;
  plants: string;
}

export const generateUserCSVTemplate = (): string => {
  const headers = ['nik', 'password', 'full_name', 'role', 'menus', 'plants'];
  const examples = [
    ['12345', 'password123', 'John Doe', 'qc_field', 'sanitasi_besar', 'Plant-1'],
    ['67890', 'pass456', 'Jane Smith', 'supervisor', '"sanitasi_besar,kliping"', '"Plant-1,Plant-2"'],
    ['11223', 'admin789', 'Admin User', 'admin', '"sanitasi_besar,kliping,monitoring_area,audit_internal"', '"Plant-1,Plant-2,Plant-3"']
  ];

  const rows = [headers, ...examples];
  return rows.map(row => row.join(',')).join('\n');
};

export const downloadCSVTemplate = () => {
  const csv = generateUserCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'template_user_import.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

export const parseCSV = (csvText: string): CSVUserData[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file kosong atau tidak valid');
  }

  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map(h => h.trim().toLowerCase());
  const requiredHeaders = ['nik', 'password', 'full_name', 'role', 'menus', 'plants'];

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Header '${required}' tidak ditemukan dalam CSV`);
    }
  }

  const nikIndex = headers.indexOf('nik');
  const passwordIndex = headers.indexOf('password');
  const fullNameIndex = headers.indexOf('full_name');
  const roleIndex = headers.indexOf('role');
  const menusIndex = headers.indexOf('menus');
  const plantsIndex = headers.indexOf('plants');

  const users: CSVUserData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    if (values.length < 6) {
      throw new Error(`Baris ${i + 1}: Data tidak lengkap (NIK, password, nama, dan role wajib diisi)`);
    }

    const nik = values[nikIndex]?.trim() || '';
    const password = values[passwordIndex]?.trim() || '';
    const full_name = values[fullNameIndex]?.trim() || '';
    const role = values[roleIndex]?.trim() as CSVUserData['role'];
    const menus = values[menusIndex]?.trim() || '';
    const plants = values[plantsIndex]?.trim() || '';

    if (!nik || !password || !full_name || !role) {
      throw new Error(`Baris ${i + 1}: Data tidak lengkap (NIK, password, nama, dan role wajib diisi)`);
    }

    if (!['admin', 'supervisor', 'qc_field', 'manajer'].includes(role)) {
      throw new Error(`Baris ${i + 1}: Role '${role}' tidak valid. Role harus: admin, supervisor, qc_field, atau manajer`);
    }

    users.push({
      nik,
      password,
      full_name,
      role,
      menus,
      plants
    });
  }

  return users;
};

export const validateCSVUsers = (users: CSVUserData[]): string[] => {
  const errors: string[] = [];
  const nikSet = new Set<string>();

  users.forEach((user, index) => {
    const rowNum = index + 2;

    if (nikSet.has(user.nik)) {
      errors.push(`Baris ${rowNum}: NIK '${user.nik}' duplikat`);
    }
    nikSet.add(user.nik);

    if (user.nik.length < 3) {
      errors.push(`Baris ${rowNum}: NIK minimal 3 karakter`);
    }

    if (user.password.length < 6) {
      errors.push(`Baris ${rowNum}: Password minimal 6 karakter`);
    }

    if (user.full_name.length < 3) {
      errors.push(`Baris ${rowNum}: Nama lengkap minimal 3 karakter`);
    }
  });

  return errors;
};

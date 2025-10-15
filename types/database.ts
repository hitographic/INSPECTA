export interface User {
  id?: number;
  nik: string;
  password: string;
  name?: string;
}

export interface SanitationRecord {
  id?: number;
  user_id: number;
  plant: string;
  line: string;
  tanggal: string;
  createdAt: string;
}

export interface SanitationDetail {
  id?: number;
  record_id: number;
  area: string;
  bagian: string;
  foto_sebelum?: string;
  foto_sesudah?: string;
  keterangan?: string;
  status: 'pending' | 'done';
}

export interface PlantConfig {
  [key: string]: number[];
}
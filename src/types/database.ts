export interface SanitationRecord {
  id?: number;
  plant: string;
  line: string;
  area: string;
  bagian: string;
  photoBeforeUri?: string;
  photoAfterUri?: string;
  foto_sebelum?: string;
  foto_sebelum_timestamp?: string;
  foto_sesudah?: string;
  foto_sesudah_timestamp?: string;
  keterangan: string;
  tanggal: string;
  createdAt?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  status?: 'draft' | 'completed';
}

export interface PlantConfig {
  [key: string]: number[];
}

export interface KlipingRecord {
  id?: number;
  id_unik?: string;
  plant: string;
  tanggal: string;
  line: string;
  regu: string;
  shift: string;

  Flavor?: string;
  Pengamatan_ke?: string;
  Mesin?: string;
  pengamatan_timestamp?: string;

  foto_etiket?: string;
  foto_banded?: string;
  foto_karton?: string;
  foto_label_etiket?: string;
  foto_label_bumbu?: string;
  foto_label_minyak_bumbu?: string;
  foto_label_si?: string;
  foto_label_opp_banded?: string;

  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_complete?: boolean;
}
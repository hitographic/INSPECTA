import { supabase } from './supabase';
import { logDelete } from './auditLog';
import { KlipingRecord } from '../types/database';
import { requestQueue } from './requestQueue';

export const insertKlipingRecord = async (record: KlipingRecord, skipDuplicateCheck: boolean = false): Promise<{ success: boolean; id?: string; error?: string; skipped?: boolean }> => {
  try {
    if (!skipDuplicateCheck) {
      const { data: existing, error: checkError } = await supabase
        .from('kliping_records')
        .select('id')
        .eq('plant', record.plant)
        .eq('tanggal', record.tanggal)
        .eq('line', record.line)
        .eq('regu', record.regu)
        .eq('shift', record.shift)
        .eq('id_unik', record.id_unik)
        .eq('mesin', record.mesin)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing record:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existing) {
        console.log('Record already exists, skipping:', {
          id_unik: record.id_unik,
          mesin: record.mesin
        });
        return { success: true, id: existing.id, skipped: true };
      }
    }

    const { data, error } = await supabase
      .from('kliping_records')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error inserting kliping record:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error in insertKlipingRecord:', error);
    return { success: false, error: String(error) };
  }
};

export const updateKlipingRecord = async (id: string, updates: Partial<KlipingRecord>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('kliping_records')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating kliping record:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateKlipingRecord:', error);
    return { success: false, error: String(error) };
  }
};

export const countKlipingPhotos = async (filters?: {
  plant?: string;
  startDate?: string;
  endDate?: string;
  line?: string;
  regu?: string;
  shift?: string;
}): Promise<{ [key: string]: number }> => {
  try {
    console.log('[KLIPING] countKlipingPhotos called with filters:', filters);

    const { data, error } = await supabase.rpc('count_kliping_photos', {
      p_plant: filters?.plant || null
    });

    if (error) {
      console.error('[KLIPING] Error counting photos:', error);
      return {};
    }

    console.log('[KLIPING] RPC returned data:', data);
    console.log('[KLIPING] Data length:', data?.length);

    const counts: { [key: string]: number } = {};
    data?.forEach((row: any) => {
      console.log('[KLIPING] Raw row.tanggal type:', typeof row.tanggal, 'value:', row.tanggal);
      const key = `${row.tanggal}_${row.line}_${row.regu}_${row.shift}_${row.pengamatan_ke}_${row.mesin}`;
      counts[key] = row.photo_count;
      console.log('[KLIPING] Photo count key:', key, '=', row.photo_count);
    });

    console.log('[KLIPING] Final counts object:', counts);
    console.log('[KLIPING] Total keys in counts:', Object.keys(counts).length);

    return counts;
  } catch (error) {
    console.error('[KLIPING] Exception in countKlipingPhotos:', error);
    return {};
  }
};

export const getKlipingRecords = async (filters?: {
  plant?: string;
  startDate?: string;
  endDate?: string;
  line?: string;
  regu?: string;
  shift?: string;
}): Promise<KlipingRecord[]> => {
  try {
    console.log('[KLIPING] Fetching records with filters:', filters);

    let query = supabase
      .from('kliping_records')
      .select('id, id_unik, plant, tanggal, line, regu, shift, flavor, pengamatan_ke, mesin, created_by, created_at, updated_at, is_complete, pengamatan_timestamp')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.plant) {
      query = query.eq('plant', filters.plant);
      console.log('[KLIPING] Filtering by plant:', filters.plant);
    }

    if (filters?.startDate) {
      query = query.gte('tanggal', filters.startDate);
      console.log('[KLIPING] Filtering by startDate:', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('tanggal', filters.endDate);
      console.log('[KLIPING] Filtering by endDate:', filters.endDate);
    }

    if (filters?.line) {
      query = query.eq('line', filters.line);
      console.log('[KLIPING] Filtering by line:', filters.line);
    }

    if (filters?.regu) {
      query = query.eq('regu', filters.regu);
      console.log('[KLIPING] Filtering by regu:', filters.regu);
    }

    if (filters?.shift) {
      query = query.eq('shift', filters.shift);
      console.log('[KLIPING] Filtering by shift:', filters.shift);
    }

    // Remove the default 1000 row limit by setting a higher limit
    query = query.limit(10000);

    const { data, error } = await query;

    if (error) {
      console.error('[KLIPING] Error fetching records:', error);
      console.error('[KLIPING] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    console.log('[KLIPING] Successfully fetched records:', data?.length || 0);
    console.log('[KLIPING] Sample data:', data?.[0]);

    return data || [];
  } catch (error) {
    console.error('[KLIPING] Exception in getKlipingRecords:', error);
    return [];
  }
};

export const getKlipingRecordById = async (id: string): Promise<KlipingRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('kliping_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching kliping record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getKlipingRecordById:', error);
    return null;
  }
};

export const getKlipingRecordPhotos = async (filters: {
  plant: string;
  tanggal: string;
  line: string;
  regu: string;
  shift: string;
  pengamatan_ke: number;
  mesin: string;
}): Promise<Partial<KlipingRecord> | null> => {
  try {
    console.log('[KLIPING] Fetching photos for mesin with filters:', filters);

    const { data, error } = await supabase
      .from('kliping_records')
      .select('foto_etiket, foto_banded, foto_karton, foto_label_etiket, foto_label_bumbu, foto_label_minyak_bumbu, foto_label_si, foto_label_opp_banded')
      .eq('plant', filters.plant)
      .eq('tanggal', filters.tanggal)
      .eq('line', filters.line)
      .eq('regu', filters.regu)
      .eq('shift', filters.shift)
      .eq('pengamatan_ke', filters.pengamatan_ke)
      .eq('mesin', filters.mesin)
      .maybeSingle();

    if (error) {
      console.error('[KLIPING] Error fetching photos:', error);
      return null;
    }

    console.log('[KLIPING] Photos fetched successfully:', data ? 'Yes' : 'No');
    return data;
  } catch (error) {
    console.error('[KLIPING] Exception in getKlipingRecordPhotos:', error);
    return null;
  }
};

export const getKlipingRecordsWithPhotos = async (filters?: {
  plant?: string;
  startDate?: string;
  endDate?: string;
  line?: string;
  regu?: string;
  shift?: string;
}): Promise<KlipingRecord[]> => {
  try {
    console.log('[KLIPING] Fetching records WITH PHOTOS with filters:', filters);

    const BATCH_SIZE = 10;
    let allRecords: KlipingRecord[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`[KLIPING] Fetching batch ${Math.floor(offset / BATCH_SIZE) + 1} starting at offset ${offset}...`);

      const { data, error } = await requestQueue.add(async () => {
        let query = supabase
          .from('kliping_records')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (filters?.plant) {
          query = query.eq('plant', filters.plant);
        }

        if (filters?.startDate) {
          query = query.gte('tanggal', filters.startDate);
        }

        if (filters?.endDate) {
          query = query.lte('tanggal', filters.endDate);
        }

        if (filters?.line) {
          query = query.eq('line', filters.line);
        }

        if (filters?.regu) {
          query = query.eq('regu', filters.regu);
        }

        if (filters?.shift) {
          query = query.eq('shift', filters.shift);
        }

        return await query;
      });

      if (error) {
        console.error('[KLIPING] Error fetching batch:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        console.log(`[KLIPING] Fetched ${data.length} records in this batch, total so far: ${allRecords.length + data.length}`);
        allRecords = allRecords.concat(data);
        offset += BATCH_SIZE;

        if (data.length < BATCH_SIZE) {
          hasMore = false;
        }
      }
    }

    console.log(`[KLIPING] Total fetched: ${allRecords.length} records WITH PHOTOS`);
    return allRecords;
  } catch (error) {
    console.error('[KLIPING] Error in getKlipingRecordsWithPhotos:', error);
    return [];
  }
};

export const deleteKlipingRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: record } = await supabase
      .from('kliping_records')
      .select('*')
      .eq('id', id)
      .single();

    if (record) {
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
        table_name: 'kliping_records',
        record_id: id,
        affected_count: 1,
        deleted_by: deletedBy,
        plant: record.plant,
        additional_info: {
          line: record.line,
          tanggal: record.tanggal,
          regu: record.regu,
          shift: record.shift,
          id_unik: record.id_unik
        }
      });
    }

    const { error } = await supabase
      .from('kliping_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting kliping record:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteKlipingRecord:', error);
    return { success: false, error: String(error) };
  }
};

export const deleteKlipingRecordsByIdUnik = async (idUnik: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: records } = await supabase
      .from('kliping_records')
      .select('*')
      .eq('id_unik', idUnik);

    if (records && records.length > 0) {
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

      const firstRecord = records[0];
      await logDelete({
        table_name: 'kliping_records',
        record_id: idUnik,
        affected_count: records.length,
        deleted_by: deletedBy,
        action: 'BULK_DELETE',
        plant: firstRecord.plant,
        additional_info: {
          line: firstRecord.line,
          tanggal: firstRecord.tanggal,
          regu: firstRecord.regu,
          shift: firstRecord.shift
        }
      });
    }

    const { error } = await supabase
      .from('kliping_records')
      .delete()
      .eq('id_unik', idUnik);

    if (error) {
      console.error('Error deleting kliping records by id_unik:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteKlipingRecordsByIdUnik:', error);
    return { success: false, error: String(error) };
  }
};

export const getLinesFromDatabase = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('lines')
      .select('line_name')
      .order('line_name');

    if (error) {
      console.error('Error fetching lines:', error);
      return ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8'];
    }

    return data?.map(item => item.line_name) || ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8'];
  } catch (error) {
    console.error('Error in getLinesFromDatabase:', error);
    return ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8'];
  }
};

export const REGU_OPTIONS = ['A', 'B', 'C'];
export const SHIFT_OPTIONS = ['1', '2', '3'];
export const MESIN_OPTIONS = ['Mesin 1', 'Mesin 2', 'Mesin 3', 'Mesin 4'];

export const FOTO_TYPES = [
  { key: 'foto_etiket', label: 'Foto Etiket', description: 'Ambil foto etiket' },
  { key: 'foto_banded', label: 'Foto Banded', description: 'Ambil foto banded' },
  { key: 'foto_karton', label: 'Foto Karton', description: 'Ambil foto karton' },
  { key: 'foto_label_etiket', label: 'Foto Label Etiket', description: 'Ambil foto label etiket' },
  { key: 'foto_label_bumbu', label: 'Foto Label Bumbu', description: 'Ambil foto label bumbu' },
  { key: 'foto_label_minyak_bumbu', label: 'Foto Label Minyak Bumbu', description: 'Ambil foto label minyak bumbu' },
  { key: 'foto_label_si', label: 'Foto Label SI', description: 'Ambil foto label SI' },
  { key: 'foto_label_opp_banded', label: 'Foto Label OPP Banded', description: 'Ambil foto label OPP banded' },
];

import { supabase } from './supabase';

export interface AuditLogEntry {
  table_name: string;
  record_id: string;
  affected_count: number;
  deleted_by: string;
  action?: string;
  plant?: string;
  additional_info?: any;
}

export const logDelete = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        table_name: entry.table_name,
        record_id: entry.record_id,
        affected_count: entry.affected_count,
        deleted_by: entry.deleted_by,
        action: entry.action || 'DELETE',
        plant: entry.plant,
        additional_info: entry.additional_info || {}
      });

    if (error) {
      console.error('[AUDIT LOG] Failed to log delete:', error);
    } else {
      console.log('[AUDIT LOG] Delete logged successfully:', {
        table: entry.table_name,
        record_id: entry.record_id,
        deleted_by: entry.deleted_by
      });
    }
  } catch (error) {
    console.error('[AUDIT LOG] Error logging delete:', error);
  }
};

export const getAuditLogs = async (filters?: {
  table_name?: string;
  deleted_by?: string;
  plant?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) => {
  try {
    console.log('[AUDIT LOG] Fetching audit logs with filters:', filters);

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (filters?.table_name) {
      query = query.eq('table_name', filters.table_name);
    }

    if (filters?.deleted_by) {
      query = query.eq('deleted_by', filters.deleted_by);
    }

    if (filters?.plant) {
      query = query.eq('plant', filters.plant);
    }

    if (filters?.start_date) {
      query = query.gte('deleted_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('deleted_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    console.log('[AUDIT LOG] Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('[AUDIT LOG] Failed to fetch audit logs:', error);
      console.error('[AUDIT LOG] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[AUDIT LOG] Successfully fetched audit logs:', data?.length || 0, 'records');
    console.log('[AUDIT LOG] First record:', data?.[0]);
    return data || [];
  } catch (error) {
    console.error('[AUDIT LOG] Error fetching audit logs:', error);
    return [];
  }
};

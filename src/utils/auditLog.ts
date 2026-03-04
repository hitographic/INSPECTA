import { gGet, gPost } from './googleApi';

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
    const result = await gPost('logDelete', {
      table_name: entry.table_name,
      record_id: entry.record_id,
      affected_count: entry.affected_count,
      deleted_by: entry.deleted_by,
      action: entry.action || 'DELETE',
      plant: entry.plant,
      additional_info: entry.additional_info || {}
    });

    if (result.success) {
      console.log('[AUDIT LOG] Delete logged successfully:', {
        table: entry.table_name,
        record_id: entry.record_id,
        deleted_by: entry.deleted_by
      });
    } else {
      console.error('[AUDIT LOG] Failed to log delete:', result.error);
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
    const params: Record<string, string> = {};
    if (filters?.table_name) params.table_name = filters.table_name;
    if (filters?.deleted_by) params.deleted_by = filters.deleted_by;
    if (filters?.plant) params.plant = filters.plant;
    if (filters?.start_date) params.start_date = filters.start_date;
    if (filters?.end_date) params.end_date = filters.end_date;
    if (filters?.limit) params.limit = String(filters.limit);

    const data = await gGet('getAuditLogs', params);
    console.log('[AUDIT LOG] Fetched:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('[AUDIT LOG] Error fetching audit logs:', error);
    return [];
  }
};

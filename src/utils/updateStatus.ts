import { gGet, gPost } from './googleApi';

/**
 * Updates all records with status 'draft' or 'DRAFT' to 'completed'
 */
export async function updateAllDraftToCompleted() {
  try {
    console.log('Starting status update: DRAFT -> COMPLETED');

    // Get all sanitation records
    const allRecords = await gGet('get', { table: 'sanitation_records' });
    const records = Array.isArray(allRecords) ? allRecords : [];

    let totalUpdated = 0;
    let draftUpdated = 0;
    let upperDraftUpdated = 0;

    for (const record of records) {
      if (record.status === 'draft') {
        await gPost('update', { table: 'sanitation_records', id: record.id, data: { status: 'completed' } });
        draftUpdated++;
        totalUpdated++;
      } else if (record.status === 'DRAFT') {
        await gPost('update', { table: 'sanitation_records', id: record.id, data: { status: 'completed' } });
        upperDraftUpdated++;
        totalUpdated++;
      }
    }

    console.log(`Successfully updated ${totalUpdated} records from DRAFT to COMPLETED`);

    return {
      success: true,
      updated: totalUpdated,
      draftUpdated,
      upperDraftUpdated
    };
  } catch (error) {
    console.error('Failed to update status:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Gets count of records by status
 */
export async function getStatusCounts() {
  try {
    const allRecords = await gGet('get', { table: 'sanitation_records' });
    const records = Array.isArray(allRecords) ? allRecords : [];

    const counts: Record<string, number> = {};
    records.forEach((record: any) => {
      const status = record.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });

    console.log('Status counts:', counts);
    return counts;
  } catch (error) {
    console.error('Failed to get status counts:', error);
    return {};
  }
}

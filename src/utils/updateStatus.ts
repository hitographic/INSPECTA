import { supabase } from './supabase';

/**
 * Updates all records with status 'draft' or 'DRAFT' to 'completed'
 */
export async function updateAllDraftToCompleted() {
  try {
    console.log('Starting status update: DRAFT -> COMPLETED');

    // Update all records with status 'draft' (lowercase)
    const { data: draftData, error: draftError } = await supabase
      .from('sanitation_records')
      .update({ status: 'completed' })
      .eq('status', 'draft')
      .select('id');

    if (draftError) {
      console.error('Error updating draft records:', draftError);
      throw draftError;
    }

    // Update all records with status 'DRAFT' (uppercase)
    const { data: upperData, error: upperError } = await supabase
      .from('sanitation_records')
      .update({ status: 'completed' })
      .eq('status', 'DRAFT')
      .select('id');

    if (upperError) {
      console.error('Error updating DRAFT records:', upperError);
      throw upperError;
    }

    const totalUpdated = (draftData?.length || 0) + (upperData?.length || 0);
    console.log(`Successfully updated ${totalUpdated} records from DRAFT to COMPLETED`);

    return {
      success: true,
      updated: totalUpdated,
      draftUpdated: draftData?.length || 0,
      upperDraftUpdated: upperData?.length || 0
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
    const { data, error } = await supabase
      .from('sanitation_records')
      .select('status');

    if (error) {
      console.error('Error fetching status counts:', error);
      throw error;
    }

    const counts: Record<string, number> = {};
    data?.forEach(record => {
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

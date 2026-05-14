import { gGet } from './googleApi';

export interface Area {
  id: string;
  name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Bagian {
  id: string;
  area_id: string;
  name: string;
  keterangan: string;
  line_numbers: string[];
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface LineConfig {
  id: number;
  line_number: string;
  line_type: string;
  plant: string;
  is_active: boolean;
}

export const getAreas = async (): Promise<Area[]> => {
  try {
    const data = await gGet('getAreas');
    return data || [];
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
};

export const getAreaDisplayOrder = async (areaName: string): Promise<number> => {
  try {
    const areas = await gGet('getAreas');
    const area = (areas || []).find((a: any) => a.name === areaName);
    return area?.display_order || 999;
  } catch (error) {
    console.error('Error fetching area display order:', error);
    return 999;
  }
};

export const sortAreasByDisplayOrder = async (areaNames: string[]): Promise<string[]> => {
  try {
    console.log('sortAreasByDisplayOrder called with:', areaNames);
    
    // Import AREAS constant for correct area ordering
    const { AREAS } = await import('../constants/AppConstants');
    
    // Sort areas based on AREAS constant order
    // Areas not in constant will be placed at the end in alphabetical order
    const sorted = areaNames.sort((a, b) => {
      const indexA = AREAS.indexOf(a);
      const indexB = AREAS.indexOf(b);
      
      // Both in AREAS constant
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // A is in AREAS, B is not - A comes first
      if (indexA !== -1) return -1;
      
      // B is in AREAS, A is not - B comes first
      if (indexB !== -1) return 1;
      
      // Neither in AREAS - sort alphabetically
      return a.localeCompare(b);
    });
    
    console.log('sortAreasByDisplayOrder returning:', sorted);
    return sorted;
  } catch (error) {
    console.error('Error sorting areas:', error);
    return areaNames;
  }
};

export const getBagianByArea = async (areaId: string): Promise<Bagian[]> => {
  try {
    const data = await gGet('getBagianByArea', { areaId });
    return (data || []).map((b: any) => ({
      ...b,
      line_numbers: Array.isArray(b.line_numbers) ? b.line_numbers : []
    }));
  } catch (error) {
    console.error('Error fetching bagian:', error);
    return [];
  }
};

export const getBagianByAreaName = async (areaName: string): Promise<Bagian[]> => {
  try {
    const data = await gGet('getBagianByAreaName', { areaName });
    return (data || []).map((b: any) => ({
      ...b,
      line_numbers: Array.isArray(b.line_numbers) ? b.line_numbers : []
    }));
  } catch (error) {
    console.error('Error fetching bagian by area name:', error);
    return [];
  }
};

export const getBagianForLine = async (lineNumber: string): Promise<{ [areaName: string]: Bagian[] }> => {
  try {
    const data = await gGet('getBagianForLine', { lineNumber });
    // Data is already grouped by area name from the backend
    if (!data || typeof data !== 'object') return {};

    const result: { [areaName: string]: Bagian[] } = {};
    for (const [areaName, bagianList] of Object.entries(data)) {
      result[areaName] = (bagianList as any[]).map((b: any) => ({
        ...b,
        line_numbers: Array.isArray(b.line_numbers) ? b.line_numbers : []
      }));
    }
    return result;
  } catch (error) {
    console.error('Error fetching bagian for line:', error);
    return {};
  }
};

export const getLineConfiguration = async (lineNumber: string): Promise<LineConfig | null> => {
  try {
    const data = await gGet('getLineConfiguration', { lineNumber });
    return data || null;
  } catch (error) {
    console.error('Error fetching line configuration:', error);
    return null;
  }
};

export const getAllLinesByPlant = async (plant: string): Promise<string[]> => {
  try {
    const data = await gGet('getAllLinesByPlant', { plant });
    return data || [];
  } catch (error) {
    console.error('Error fetching lines by plant:', error);
    return [];
  }
};

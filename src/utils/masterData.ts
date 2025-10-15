import { supabase } from './supabase';

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
    const { data, error } = await supabase
      .from('sanitation_areas')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
};

export const getBagianByArea = async (areaId: string): Promise<Bagian[]> => {
  try {
    const { data, error } = await supabase
      .from('sanitation_bagian')
      .select('*')
      .eq('area_id', areaId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bagian:', error);
    return [];
  }
};

export const getBagianForLine = async (lineNumber: string): Promise<{ [areaName: string]: Bagian[] }> => {
  try {
    const { data: bagianData, error: bagianError } = await supabase
      .from('sanitation_bagian')
      .select(`
        *,
        sanitation_areas(name, display_order)
      `)
      .contains('line_numbers', [lineNumber]);

    if (bagianError) throw bagianError;

    const grouped: { [areaName: string]: { bagian: Bagian[], areaOrder: number } } = {};

    bagianData?.forEach((item: any) => {
      const areaName = item.sanitation_areas?.name || 'Unknown';
      const areaOrder = item.sanitation_areas?.display_order || 999;

      if (!grouped[areaName]) {
        grouped[areaName] = { bagian: [], areaOrder };
      }
      grouped[areaName].bagian.push({
        id: item.id,
        area_id: item.area_id,
        name: item.name,
        keterangan: item.keterangan,
        line_numbers: item.line_numbers,
        display_order: item.display_order
      });
    });

    const sortedGrouped: { [areaName: string]: Bagian[] } = {};

    Object.entries(grouped)
      .sort(([, a], [, b]) => a.areaOrder - b.areaOrder)
      .forEach(([areaName, data]) => {
        data.bagian.sort((a, b) => a.display_order - b.display_order);
        sortedGrouped[areaName] = data.bagian;
      });

    return sortedGrouped;
  } catch (error) {
    console.error('Error fetching bagian for line:', error);
    return {};
  }
};

export const getLineConfiguration = async (lineNumber: string): Promise<LineConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('line_configurations')
      .select('*')
      .eq('line_number', lineNumber)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching line configuration:', error);
    return null;
  }
};

export const getAllLinesByPlant = async (plant: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('line_configurations')
      .select('line_number')
      .eq('plant', plant)
      .eq('is_active', true)
      .order('line_number', { ascending: true });

    if (error) throw error;
    return data?.map(item => item.line_number) || [];
  } catch (error) {
    console.error('Error fetching lines by plant:', error);
    return [];
  }
};

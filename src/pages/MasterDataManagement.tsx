import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Search, Filter } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { authService } from '../utils/authService';

interface Area {
  id: string;
  name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface Bagian {
  id: string;
  area_id: string;
  name: string;
  keterangan: string;
  line_numbers: string[];
  display_order: number;
  created_at?: string;
  updated_at?: string;
  area_name?: string;
}

interface Supervisor {
  id: string;
  plant: string;
  supervisor_name: string;
  created_at?: string;
  updated_at?: string;
}

type TabType = 'areas' | 'bagian' | 'supervisors';
type SortField = 'display_order' | 'area_name' | 'name';
type SortDirection = 'asc' | 'desc';

export default function MasterDataManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('areas');
  const [areas, setAreas] = useState<Area[]>([]);
  const [bagianList, setBagianList] = useState<Bagian[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'keterangan' | 'area'>('all');
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterLines, setFilterLines] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const canAccessMasterData = authService.hasPermission('view_admin_panel') ||
                                 authService.hasPermission('manage_master_data') ||
                                 currentUser?.role === 'manajer' ||
                                 currentUser?.role === 'supervisor';

    if (!canAccessMasterData) {
      navigate('/menu');
      return;
    }
    loadData();
  }, [navigate, activeTab]);

  useEffect(() => {
    if (activeTab === 'areas') {
      loadAreas();
    }
  }, []);

  const loadAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('sanitation_areas')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'areas') {
        await loadAreas();
      } else if (activeTab === 'bagian') {
        const { data: bagianData, error } = await supabase
          .from('sanitation_bagian')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;

        const { data: areasData } = await supabase
          .from('sanitation_areas')
          .select('*');

        const areasMap = new Map(areasData?.map(a => [a.id, a.name]) || []);

        const formatted = bagianData?.map(item => {
          let lineNumbers = item.line_numbers || [];

          // Parse if line_numbers is a string
          if (typeof lineNumbers === 'string') {
            try {
              lineNumbers = JSON.parse(lineNumbers);
            } catch {
              lineNumbers = [];
            }
          }

          // Ensure it's an array
          if (!Array.isArray(lineNumbers)) {
            lineNumbers = [];
          }

          return {
            ...item,
            line_numbers: lineNumbers,
            area_name: areasMap.get(item.area_id) || 'Unknown'
          };
        }) || [];

        setBagianList(formatted);
        setAreas(areasData || []);
      } else if (activeTab === 'supervisors') {
        const { data: supervisorsData, error } = await supabase
          .from('supervisors')
          .select('*')
          .order('plant', { ascending: true });

        if (error) throw error;
        setSupervisors(supervisorsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Gagal memuat data: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    if (activeTab === 'areas') {
      setFormData({ name: '', display_order: areas.length + 1 });
    } else if (activeTab === 'bagian') {
      setFormData({
        area_id: areas[0]?.id || '',
        name: '',
        keterangan: '',
        line_numbers: [],
        display_order: bagianList.length + 1
      });
    } else if (activeTab === 'supervisors') {
      setFormData({
        plant: 'Plant-1',
        supervisor_name: ''
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);

    // Ensure line_numbers is properly formatted for bagian
    if (activeTab === 'bagian') {
      let lineNumbers = item.line_numbers || [];
      if (typeof lineNumbers === 'string') {
        try {
          lineNumbers = JSON.parse(lineNumbers);
        } catch {
          lineNumbers = [];
        }
      }
      if (!Array.isArray(lineNumbers)) {
        lineNumbers = [];
      }
      setFormData({ ...item, line_numbers: lineNumbers });
    } else {
      setFormData({ ...item });
    }

    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      let tableName = 'sanitation_areas';
      if (activeTab === 'bagian') tableName = 'sanitation_bagian';
      if (activeTab === 'supervisors') tableName = 'supervisors';

      if (editingId) {
        const updateData = { ...formData };
        delete updateData.id;
        delete updateData.area_name;
        delete updateData.created_at;
        delete updateData.updated_at;

        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const insertData = { ...formData };
        delete insertData.id;
        delete insertData.area_name;
        delete insertData.created_at;
        delete insertData.updated_at;

        const { error } = await supabase
          .from(tableName)
          .insert([insertData]);

        if (error) throw error;
      }

      setShowAddForm(false);
      setFormData({});
      await loadData();
      alert('Data berhasil disimpan');
    } catch (error: any) {
      console.error('Error saving data:', error);
      alert('Gagal menyimpan data: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
      let tableName = 'sanitation_areas';
      if (activeTab === 'bagian') tableName = 'sanitation_bagian';
      if (activeTab === 'supervisors') tableName = 'supervisors';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
      alert('Data berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting data:', error);
      alert('Gagal menghapus data: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({});
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSearchField('all');
    setFilterArea('');
    setFilterLines('');
    setSortField('display_order');
    setSortDirection('asc');
  };

  const getFilteredAndSortedBagian = () => {
    let filtered = [...bagianList];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => {
        if (searchField === 'all') {
          const lineNumbers = Array.isArray(b.line_numbers) ? b.line_numbers : [];
          return b.name.toLowerCase().includes(query) ||
                 b.keterangan.toLowerCase().includes(query) ||
                 b.area_name?.toLowerCase().includes(query) ||
                 lineNumbers.some(line => line.includes(query));
        } else if (searchField === 'name') {
          return b.name.toLowerCase().includes(query);
        } else if (searchField === 'keterangan') {
          return b.keterangan.toLowerCase().includes(query);
        } else if (searchField === 'area') {
          return b.area_name?.toLowerCase().includes(query);
        }
        return true;
      });
    }

    if (filterArea) {
      filtered = filtered.filter(b => b.area_id === filterArea);
    }

    if (filterLines) {
      filtered = filtered.filter(b => {
        const lineNumbers = Array.isArray(b.line_numbers) ? b.line_numbers : [];
        return lineNumbers.includes(filterLines);
      });
    }

    filtered.sort((a, b) => {
      let aVal: string | number, bVal: string | number;

      if (sortField === 'display_order') {
        aVal = a.display_order;
        bVal = b.display_order;
      } else if (sortField === 'area_name') {
        aVal = a.area_name || '';
        bVal = b.area_name || '';
      } else {
        aVal = a.name;
        bVal = b.name;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getAllUniqueLines = () => {
    const lines = new Set<string>();
    bagianList.forEach(b => {
      const lineNumbers = Array.isArray(b.line_numbers) ? b.line_numbers : [];
      lineNumbers.forEach(line => lines.add(line));
    });
    return Array.from(lines).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  const renderAreasTab = () => (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleAdd}
          style={{
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={20} />
          Tambah Area
        </button>
      </div>

      {showAddForm && (
        <div style={{
          background: '#F3F4F6',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '700' }}>
            {editingId ? 'Edit Area' : 'Tambah Area Baru'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                Nama Area <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Mixer, Cutter, Alkali Ingredient"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB',
                  width: '100%'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                Urutan Tampilan <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB'
              }}>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order || ''}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    width: '100px',
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '0.25rem' }}>
                    Menentukan urutan tampilan area ini di tabel
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Semakin kecil angka, semakin atas posisinya. Total area saat ini: {areas.length}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #D1D5DB'
            }}>
              <button
                onClick={handleSave}
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  flex: 1
                }}
              >
                <Save size={18} />
                Simpan
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  flex: 1
                }}
              >
                <X size={18} />
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <thead style={{ position: 'sticky', top: 0, background: '#F3F4F6', zIndex: 10 }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Urutan</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Nama Area</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                <td style={{ padding: '1rem' }}>{area.display_order}</td>
                <td style={{ padding: '1rem' }}>{area.name}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(area)}
                      style={{
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      style={{
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBagianTab = () => {
    const filteredBagian = getFilteredAndSortedBagian();
    const uniqueLines = getAllUniqueLines();

    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={handleAdd}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={20} />
            Tambah Bagian
          </button>
        </div>

        <div style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Search size={20} style={{ color: '#6B7280' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Pencarian & Filter</h3>
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <Filter size={16} />
              {showAdvancedFilter ? 'Sembunyikan' : 'Filter Lanjutan'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: showAdvancedFilter ? '1rem' : 0 }}>
            <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
              <input
                type="text"
                placeholder="Ketik untuk mencari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as any)}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                minWidth: '140px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="all">🔍 Semua Field</option>
              <option value="name">📝 Nama Bagian</option>
              <option value="keterangan">📄 Keterangan</option>
              <option value="area">📍 Area</option>
            </select>

            <button
              onClick={resetFilters}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              ↻ Reset
            </button>
          </div>

          {showAdvancedFilter && (
            <div style={{
              paddingTop: '1rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>
                  Filter berdasarkan Area:
                </label>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    minWidth: '180px',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="">Semua Area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>
                  Filter berdasarkan Line:
                </label>
                <select
                  value={filterLines}
                  onChange={(e) => setFilterLines(e.target.value)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #D1D5DB',
                    minWidth: '120px',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="">Semua Line</option>
                  {uniqueLines.map(line => (
                    <option key={line} value={line}>Line {line}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>
                  Urutkan berdasarkan:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    style={{
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      minWidth: '140px',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="display_order">Urutan</option>
                    <option value="area_name">Area</option>
                    <option value="name">Nama Bagian</option>
                  </select>

                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      background: sortDirection === 'asc' ? '#EFF6FF' : '#FEF3C7',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: sortDirection === 'asc' ? '#1E40AF' : '#92400E'
                    }}
                  >
                    {sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                  </button>
                </div>
              </div>

              <div style={{
                marginLeft: 'auto',
                padding: '0.5rem 0.75rem',
                background: '#F3F4F6',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Hasil: <strong>{filteredBagian.length}</strong> dari {bagianList.length}
              </div>
            </div>
          )}
        </div>

        {showAddForm && (
          <div style={{
            background: '#F3F4F6',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '700' }}>
              {editingId ? 'Edit Bagian' : 'Tambah Bagian Baru'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                  Area <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.area_id || ''}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #D1D5DB',
                    width: '100%'
                  }}
                >
                  <option value="">Pilih Area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                  Nama Bagian <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Weighing Tank Alkali"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #D1D5DB',
                    width: '100%'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                  Keterangan <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  placeholder="Masukkan keterangan detail tentang bagian ini..."
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  rows={4}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #D1D5DB',
                    fontFamily: 'inherit',
                    width: '100%',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.875rem' }}>
                  Berlaku untuk Line <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  {Array.from({ length: 33 }, (_, i) => (i + 1).toString()).map(line => {
                    const isChecked = formData.line_numbers?.includes(line) || false;
                    return (
                      <label
                        key={line}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          background: isChecked ? '#DBEAFE' : 'transparent',
                          border: `1px solid ${isChecked ? '#3B82F6' : '#E5E7EB'}`,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentLines = formData.line_numbers || [];
                            const newLines = e.target.checked
                              ? [...currentLines, line]
                              : currentLines.filter((l: string) => l !== line);
                            setFormData({ ...formData, line_numbers: newLines });
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: isChecked ? '600' : '400',
                          color: isChecked ? '#1E40AF' : '#4B5563'
                        }}>
                          {line}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                  {formData.line_numbers?.length || 0} line dipilih
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
                  Urutan Tampilan <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB'
                }}>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order || ''}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #D1D5DB',
                      width: '100px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '0.25rem' }}>
                      Menentukan urutan tampilan bagian ini di tabel
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Semakin kecil angka, semakin atas posisinya. Total bagian saat ini: {bagianList.length}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #D1D5DB'
              }}>
                <button
                  onClick={handleSave}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                >
                  <Save size={18} />
                  Simpan
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    flex: 1
                  }}
                >
                  <X size={18} />
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{
          overflowY: 'auto',
          maxHeight: '500px',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white'
          }}>
            <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB', zIndex: 10 }}>
              <tr>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    minWidth: '80px',
                    cursor: 'pointer',
                    borderBottom: '2px solid #E5E7EB',
                    fontWeight: '600'
                  }}
                  onClick={() => handleSort('display_order')}
                >
                  Urutan {sortField === 'display_order' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    minWidth: '150px',
                    cursor: 'pointer',
                    borderBottom: '2px solid #E5E7EB',
                    fontWeight: '600'
                  }}
                  onClick={() => handleSort('area_name')}
                >
                  Area {sortField === 'area_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    minWidth: '200px',
                    cursor: 'pointer',
                    borderBottom: '2px solid #E5E7EB',
                    fontWeight: '600'
                  }}
                  onClick={() => handleSort('name')}
                >
                  Nama Bagian {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  minWidth: '300px',
                  borderBottom: '2px solid #E5E7EB',
                  fontWeight: '600'
                }}>
                  Keterangan
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  minWidth: '120px',
                  borderBottom: '2px solid #E5E7EB',
                  fontWeight: '600'
                }}>
                  Line
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'center',
                  minWidth: '150px',
                  borderBottom: '2px solid #E5E7EB',
                  fontWeight: '600'
                }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBagian.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '0.875rem'
                  }}>
                    Tidak ada data yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredBagian.map((bagian) => (
                  <tr key={bagian.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '1rem' }}>{bagian.display_order}</td>
                    <td style={{ padding: '1rem' }}>{bagian.area_name}</td>
                    <td style={{ padding: '1rem' }}>{bagian.name}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4B5563' }}>
                      {bagian.keterangan ? bagian.keterangan.substring(0, 100) : '-'}
                      {bagian.keterangan && bagian.keterangan.length > 100 && '...'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(Array.isArray(bagian.line_numbers) ? bagian.line_numbers : []).map(line => (
                          <span
                            key={line}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              background: '#DBEAFE',
                              color: '#1E40AF',
                              fontWeight: '500'
                            }}
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(bagian)}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bagian.id)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1rem', maxWidth: '100vw', overflow: 'hidden' }}>
      <button
        onClick={() => navigate('/plant-selection')}
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <ArrowLeft size={20} />
        <span style={{ fontWeight: '500' }}>Kembali ke Pilih Plant</span>
      </button>

      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#1F2937'
        }}>
          Master Data Management
        </h1>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #E5E7EB'
        }}>
          <button
            onClick={() => { setActiveTab('areas'); setShowAddForm(false); setEditingId(null); }}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'areas' ? '#3B82F6' : 'transparent',
              color: activeTab === 'areas' ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'areas' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Areas
          </button>
          <button
            onClick={() => { setActiveTab('bagian'); setShowAddForm(false); setEditingId(null); }}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'bagian' ? '#3B82F6' : 'transparent',
              color: activeTab === 'bagian' ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'bagian' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Bagian
          </button>
          <button
            onClick={() => { setActiveTab('supervisors'); setShowAddForm(false); setEditingId(null); }}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'supervisors' ? '#3B82F6' : 'transparent',
              color: activeTab === 'supervisors' ? 'white' : '#6B7280',
              border: 'none',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'supervisors' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            Supervisors
          </button>
        </div>

        {activeTab === 'areas' && renderAreasTab()}
        {activeTab === 'bagian' && renderBagianTab()}
        {activeTab === 'supervisors' && renderSupervisorsTab()}
      </div>
    </div>
  );

  function renderSupervisorsTab() {
    return (
  <div>
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={handleAdd}
        style={{
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.75rem 1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <Plus size={20} />
        Tambah Supervisor
      </button>
    </div>

    {showAddForm && (
      <div style={{
        background: '#F3F4F6',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '700' }}>
          {editingId ? 'Edit Supervisor' : 'Tambah Supervisor Baru'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
              Plant <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={formData.plant || ''}
              onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
              disabled={!!editingId}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB',
                width: '100%',
                background: editingId ? '#F3F4F6' : 'white'
              }}
            >
              <option value="Plant-1">Plant-1</option>
              <option value="Plant-2">Plant-2</option>
              <option value="Plant-3">Plant-3</option>
            </select>
            {editingId && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                Plant tidak bisa diubah saat edit
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
              Nama Supervisor <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={formData.supervisor_name || ''}
              onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB',
                width: '100%'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #D1D5DB'
          }}>
            <button
              onClick={handleSave}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                flex: 1
              }}
            >
              <Save size={18} />
              Simpan
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                flex: 1
              }}
            >
              <X size={18} />
              Batal
            </button>
          </div>
        </div>
      </div>
    )}

    <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <thead style={{ position: 'sticky', top: 0, background: '#F3F4F6', zIndex: 10 }}>
          <tr>
            <th style={{ padding: '1rem', textAlign: 'left', width: '30%' }}>Plant</th>
            <th style={{ padding: '1rem', textAlign: 'left', width: '50%' }}>Nama Supervisor</th>
            <th style={{ padding: '1rem', textAlign: 'center', width: '20%' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.map((supervisor) => (
            <tr key={supervisor.id} style={{ borderTop: '1px solid #E5E7EB' }}>
              <td style={{ padding: '1rem', fontWeight: '600' }}>{supervisor.plant}</td>
              <td style={{ padding: '1rem' }}>{supervisor.supervisor_name}</td>
              <td style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleEdit(supervisor)}
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(supervisor.id)}
                    style={{
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
    );
  }
}

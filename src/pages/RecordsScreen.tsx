import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getRecordsByPlant, deleteRecord, initDatabase } from '../utils/database';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { updateAllDraftToCompleted, getStatusCounts } from '../utils/updateStatus';
import { SanitationRecord } from '../types/database';
import { PLANTS, AREAS, BAGIAN_BY_AREA } from '../constants/AppConstants';
import { ArrowLeft, Plus, FileEdit as Edit3, Trash2, FileText, Settings } from 'lucide-react';
import { X } from 'lucide-react';
import { authService } from '../utils/authService';
import { requestQueue } from '../utils/requestQueue';

export default function RecordsScreen() {
  const [records, setRecords] = useState<SanitationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SanitationRecord[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchLine, setSearchLine] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showLinePopup, setShowLinePopup] = useState(false);
  const { selectedPlant, setSelectedLine, currentUser, isLoading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      navigate('/');
      return;
    }

    if (!selectedPlant) {
      navigate('/plant-selection');
      return;
    }

    // Don't block on initDatabase - load records directly
    // initDatabase is just a connection test, not required for loading data
    loadRecords();
    initDatabase().catch(err => {
      console.warn('[RECORDS SCREEN] initDatabase failed (non-fatal):', err);
    });

    return () => {
      console.log('[RECORDS SCREEN] Cleanup: aborting pending requests');
      requestQueue.abort();
      requestQueue.reset();
    };
  }, [currentUser, selectedPlant, navigate, isLoading]);

  useEffect(() => {
    filterRecords();
  }, [records, searchDate, searchLine]);

  const loadRecords = async () => {
    if (!selectedPlant) return;

    try {
      setLoading(true);
      const data = await getRecordsByPlant(selectedPlant);
      setRecords(data);
    } catch (error) {
      console.error('Load records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (searchDate) {
      filtered = filtered.filter(record => record.tanggal === searchDate);
    }

    if (searchLine) {
      filtered = filtered.filter(record => record.line === searchLine);
    }

    setFilteredRecords(filtered);
  };

  const handleDeleteByDate = async (date: string) => {
    const recordsForDate = getRecordsByDate(date);
    const recordCount = recordsForDate.length;

    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${recordCount} record pada tanggal ${date}?\n\nTindakan ini tidak dapat dibatalkan!`)) {
      return;
    }

    try {
      setLoading(true);
      for (const record of recordsForDate) {
        if (record.id) {
          await deleteRecord(record.id);
        }
      }
      alert(`Berhasil menghapus ${recordCount} record pada tanggal ${date}`);
      await loadRecords();
    } catch (error) {
      console.error('Error deleting records by date:', error);
      alert('Gagal menghapus beberapa record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!searchLine) {
      alert('Silakan pilih Line terlebih dahulu');
      return;
    }

    const recordCount = filteredRecords.length;

    if (recordCount === 0) {
      alert('Tidak ada data untuk dihapus');
      return;
    }

    if (!window.confirm(`PERHATIAN!\n\nAnda akan menghapus SEMUA DATA (${recordCount} records) untuk Line ${searchLine}.\n\nTindakan ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin?`)) {
      return;
    }

    if (!window.confirm(`Konfirmasi terakhir!\n\nYakin ingin menghapus ${recordCount} records?`)) {
      return;
    }

    try {
      setLoading(true);
      for (const record of filteredRecords) {
        if (record.id) {
          await deleteRecord(record.id);
        }
      }
      alert(`Berhasil menghapus ${recordCount} records dari Line ${searchLine}`);
      await loadRecords();
    } catch (error) {
      console.error('Error deleting all data:', error);
      alert('Gagal menghapus beberapa record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus record ini?')) {
      try {
        await deleteRecord(id);
        loadRecords();
      } catch (error) {
        alert('Gagal menghapus record');
      }
    }
  };

  const handleCreateNew = () => {
    setShowLinePopup(true);
  };

  const handleLineSelect = (selectedLine: string) => {
    setSelectedLine(selectedLine);
    setShowLinePopup(false);
    navigate('/create-record');
  };

  const handleEdit = (record: SanitationRecord) => {
    // Find the correct bagian index for navigation
    const allBagian = getAllBagianList();
    const bagianIndex = allBagian.findIndex(item => 
      item.area === record.area && item.bagian === record.bagian
    );
    
    setSelectedLine(record.line);
    
    // Store the target bagian index for navigation
    localStorage.setItem('editBagianIndex', bagianIndex.toString());
    localStorage.setItem('editRecordData', JSON.stringify({
      area: record.area,
      bagian: record.bagian,
      photoBeforeUri: record.photoBeforeUri,
      photoAfterUri: record.photoAfterUri,
      keterangan: record.keterangan,
      tanggal: record.tanggal,
      foto_sebelum_timestamp: record.foto_sebelum_timestamp,
      foto_sesudah_timestamp: record.foto_sesudah_timestamp
    }));

    navigate('/create-record');
  };
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    try {
      const success = format === 'excel' 
        ? await exportToExcel(filteredRecords)
        : await exportToPDF(filteredRecords);
      
      if (success) {
        alert(`Data berhasil diekspor ke ${format.toUpperCase()}`);
      } else {
        alert(`Gagal mengekspor data ke ${format.toUpperCase()}`);
      }
    } catch (error) {
      alert(`Gagal mengekspor data ke ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportByDate = async (date: string, format: 'excel' | 'pdf') => {
    const recordsForDate = getRecordsByDate(date);
    if (recordsForDate.length === 0) {
      alert('Tidak ada data untuk diekspor pada tanggal ini');
      return;
    }

    setExporting(true);
    try {
      const success = format === 'excel'
        ? await exportToExcel(recordsForDate)
        : await exportToPDF(recordsForDate);

      if (success) {
        alert(`Data tanggal ${date} berhasil diekspor ke ${format.toUpperCase()}`);
      } else {
        alert(`Gagal mengekspor data tanggal ${date} ke ${format.toUpperCase()}`);
      }
    } catch (error) {
      alert(`Gagal mengekspor data tanggal ${date} ke ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengubah semua status DRAFT menjadi COMPLETED?')) {
      return;
    }

    try {
      setLoading(true);
      const counts = await getStatusCounts();
      console.log('Status sebelum update:', counts);

      const result = await updateAllDraftToCompleted();

      if (result.success) {
        alert(`Berhasil mengubah ${result.updated} record dari DRAFT menjadi COMPLETED`);
        await loadRecords();

        const newCounts = await getStatusCounts();
        console.log('Status setelah update:', newCounts);
      } else {
        alert('Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Terjadi kesalahan saat mengubah status');
    } finally {
      setLoading(false);
    }
  };
  const getAllBagianList = () => {
    const allBagian: { area: string; bagian: string; index: number }[] = [];
    let index = 0;
    
    AREAS.forEach(areaItem => {
      const bagianList = BAGIAN_BY_AREA[areaItem] || [];
      bagianList.forEach(bagianItem => {
        allBagian.push({ area: areaItem, bagian: bagianItem, index });
        index++;
      });
    });
    
    return allBagian;
  };

  const getTotalRequiredBagian = () => {
    let total = 0;
    AREAS.forEach(area => {
      const bagianList = BAGIAN_BY_AREA[area] || [];
      total += bagianList.length;
    });
    return total;
  };

  const getCompletedBagianForDate = (date: string) => {
    // Get records for this date
    const recordsForDate = filteredRecords.filter(record => record.tanggal === date);

    // Remove duplicates - keep only latest record for each area+bagian combination
    const uniqueRecords = new Map();
    recordsForDate.forEach(record => {
      const key = `${record.area}-${record.bagian}`;
      const existing = uniqueRecords.get(key);

      // Keep the record with the most recent update or creation
      if (!existing ||
          (record.updated_at && (!existing.updated_at || record.updated_at > existing.updated_at)) ||
          (!record.updated_at && record.created_at && (!existing.created_at || record.created_at > existing.created_at))) {
        uniqueRecords.set(key, record);
      }
    });

    // Count completed records from unique records
    return Array.from(uniqueRecords.values()).filter(record => isRecordComplete(record)).length;
  };

  const getRecordsByDate = (date: string) => {
    return filteredRecords.filter(record => record.tanggal === date);
  };

  const getUniqueRecordDates = () => {
    const dates = [...new Set(filteredRecords.map(record => record.tanggal))];
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const isRecordComplete = (record: SanitationRecord) => {
    // Check if both photo timestamps exist (not just the photo URIs)
    return record.foto_sebelum_timestamp && record.foto_sesudah_timestamp;
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!currentUser || !selectedPlant) {
    return null;
  }

  return (
    <div className="container">
      <button className="back-button" onClick={() => navigate('/plant-selection')}>
        <ArrowLeft size={24} />
      </button>

      <button className="add-data-button" onClick={handleCreateNew}>
        <Plus size={20} />
        <span>Tambah Data</span>
      </button>

      {/* Line Selection Popup */}
      {showLinePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Pilih Line</h3>
              <button onClick={() => setShowLinePopup(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="popup-body">
              {(PLANTS[selectedPlant as keyof typeof PLANTS] || []).map((lineOption: number) => (
                <button
                  key={lineOption}
                  className="line-option"
                  onClick={() => handleLineSelect(lineOption.toString())}
                >
                  Line {lineOption}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 8rem)', overflow: 'hidden' }}>
        <div className="header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="title">Sanitation Records</h1>
              <p className="subtitle" style={{ textAlign: 'left' }}>
  {selectedPlant}
</p>
            </div>
            {authService.hasPermission('view_admin_panel') && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Settings size={18} />
                Admin Panel
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
          {(authService.hasPermission('delete_record') && searchLine) && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={handleDeleteAllData}
                disabled={loading || filteredRecords.length === 0}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: loading || filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: loading || filteredRecords.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && filteredRecords.length > 0) {
                    e.currentTarget.style.background = '#B91C1C';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#DC2626';
                }}
              >
                <Trash2 size={16} />
                Delete All Data for Line {searchLine} ({filteredRecords.length} records)
              </button>
            </div>
          )}
          <div className="form-group">
            <label className="label">Filter by Date</label>
            <label style={{ display: 'block', fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
              Pilih Tanggal
            </label>
            <input
              type="date"
              className="input"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Filter by Line</label>
            <select
              className="select"
              value={searchLine}
              onChange={(e) => setSearchLine(e.target.value)}
            >
              <option value="">Pilih Line</option>
              {(PLANTS[selectedPlant as keyof typeof PLANTS] || []).map((line: number) => (
                <option key={line} value={line.toString()}>
                  Line {line}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export and Action Buttons */}
        <div className="export-buttons">
          <button
            className="export-button excel"
            onClick={() => handleExport('excel')}
            disabled={exporting || filteredRecords.length === 0 || !searchLine}
          >
            <FileText size={16} />
            Export Excel
          </button>
          <button
            className="export-button pdf"
            onClick={() => handleExport('pdf')}
            disabled={exporting || filteredRecords.length === 0 || !searchLine}
          >
            <FileText size={16} />
            Export PDF
          </button>
          {authService.hasPermission('save_all_draft_to_completed') && (
            <button
              className="export-button"
              onClick={handleUpdateStatus}
              disabled={loading}
              style={{
                backgroundColor: '#10b981',
                border: '2px solid #059669'
              }}
            >
              <FileText size={16} />
              Update DRAFT → COMPLETED
            </button>
          )}
        </div>

        {/* Records List */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : !searchLine ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
              Silakan pilih Line terlebih dahulu untuk melihat records
            </div>
          ) : (
            <div className="records-grid">
            {getUniqueRecordDates().map((date) => {
              const recordsForDate = getRecordsByDate(date);
              const completedCount = getCompletedBagianForDate(date);
              const totalRequired = getTotalRequiredBagian();
              const isFullyComplete = completedCount === totalRequired;
              const isExpanded = expandedDates.has(date);

              return (
                <div key={date} className="record-card">
                  <div 
                    className="record-header clickable-header"
                    onClick={() => toggleDateExpansion(date)}
                  >
                    <div>
                      <div className="record-date">{date}</div>
                      <div className="record-plant">{selectedPlant}</div>
                      <div style={{ 
                        color: isFullyComplete ? '#10B981' : '#EF4444',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginTop: '0.5rem'
                      }}>
                        Selesai: {completedCount}/{totalRequired} bagian
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      color: '#6B7280',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▼
                    </div>
                  </div>

                  {/* Export buttons for this date */}
                  <div className="date-export-buttons">
                    <button
                      className="date-export-button excel"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportByDate(date, 'excel');
                      }}
                      disabled={exporting || recordsForDate.length === 0}
                      title={`Export Excel untuk tanggal ${date}`}
                    >
                      <FileText size={14} />
                      Excel
                    </button>
                    <button
                      className="date-export-button pdf"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportByDate(date, 'pdf');
                      }}
                      disabled={exporting || recordsForDate.length === 0}
                      title={`Export PDF untuk tanggal ${date}`}
                    >
                      <FileText size={14} />
                      PDF
                    </button>
                    {authService.hasPermission('delete_record') && (
                      <button
                        className="date-export-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteByDate(date);
                        }}
                        disabled={loading || recordsForDate.length === 0}
                        title={`Delete semua data tanggal ${date}`}
                        style={{
                          background: '#DC2626',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && recordsForDate.length > 0) {
                            e.currentTarget.style.background = '#B91C1C';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#DC2626';
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: '1rem' }}>
                    {/* Group records by area for better organization */}
                    {AREAS.map((areaName) => {
                      const areaRecords = recordsForDate.filter(record => record.area === areaName);
                      if (areaRecords.length === 0) return null;
                      
                      return (
                        <div key={areaName} style={{ marginBottom: '1rem' }}>
                          <div style={{
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            color: '#374151',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            background: '#E5E7EB',
                            borderRadius: '0.375rem'
                          }}>
                            {areaName}
                          </div>
                          
                          {areaRecords.map((record) => (
                            <div key={record.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: '#F8FAFC',
                              borderRadius: '0.5rem',
                              marginBottom: '0.5rem',
                              marginLeft: '1rem'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                  Line {record.line} - {record.bagian}
                                </div>
                                <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                  {record.keterangan.length > 50 
                                    ? `${record.keterangan.substring(0, 50)}...` 
                                    : record.keterangan
                                  }
                                </div>
                              </div>
                              <div className="record-actions">
                                <button 
                                  className="action-button"
                                  onClick={() => handleEdit(record)}
                                  title="Update Record"
                                >
                                  <Edit3 size={16} color="#3B82F6" />
                                </button>
                                <button 
                                  className="action-button"
                                  onClick={() => record.id && handleDelete(record.id)}
                                  title="Delete Record"
                                >
                                  <Trash2 size={16} color="#EF4444" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRecords.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                Belum ada record sanitation untuk {selectedPlant}
                {searchLine && ` Line ${searchLine}`}
                {searchDate && ` pada tanggal ${searchDate}`}
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
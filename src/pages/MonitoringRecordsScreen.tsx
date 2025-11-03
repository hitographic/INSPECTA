import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, FileDown, Trash2, Eye, X } from 'lucide-react';
import { MonitoringRecord, getMonitoringRecords, getMonitoringRecordsWithPhotos, deleteMonitoringSession, deleteMultipleMonitoringRecords } from '../utils/monitoringDatabase';
import { authService } from '../utils/authService';
import { exportMonitoringToExcel, exportMonitoringToPDF, exportAllMonitoringToExcel } from '../utils/monitoringExport';
import { PLANTS } from '../constants/AppConstants';

interface LocationState {
  selectedPlant: string;
}

const MonitoringRecordsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPlant } = (location.state as LocationState) || { selectedPlant: 'Plant-1' };

  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MonitoringRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [showLineDropdown, setShowLineDropdown] = useState(false);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [tempLine, setTempLine] = useState('');
  const [tempTanggal, setTempTanggal] = useState(new Date().toISOString().split('T')[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [previewModal, setPreviewModal] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<MonitoringRecord[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const lines = PLANTS[selectedPlant as keyof typeof PLANTS]?.map(num => `Line ${num}`) || [];

  useEffect(() => {
    loadRecords();
  }, [selectedPlant]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [records, startDate, endDate, selectedLines]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getMonitoringRecords(selectedPlant);
      setRecords(data);
    } catch (error) {
      console.error('Error loading monitoring records:', error);
      alert('Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (startDate) {
      filtered = filtered.filter(r => r.tanggal >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(r => r.tanggal <= endDate);
    }
    if (selectedLines.length > 0) {
      filtered = filtered.filter(r => selectedLines.includes(r.line));
    }

    setFilteredRecords(filtered);
  };

  const groupRecordsBySession = (records: MonitoringRecord[]) => {
    const grouped: { [key: string]: MonitoringRecord[] } = {};

    records.forEach(record => {
      const key = `${record.tanggal}_${record.line}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    return Object.values(grouped).map(group => group.sort((a, b) => a.data_number - b.data_number));
  };

  const getPaginatedGroups = (groups: MonitoringRecord[][]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groups.slice(startIndex, endIndex);
  };

  const handleCreateClick = () => {
    setShowCreatePopup(true);
  };

  const handleCreateConfirm = () => {
    if (!tempTanggal || !tempLine) {
      alert('Harap lengkapi semua field');
      return;
    }

    setShowCreatePopup(false);
    navigate('/create-monitoring', {
      state: {
        plant: selectedPlant,
        tanggal: tempTanggal,
        line: tempLine
      }
    });
  };

  const handleDeleteSession = async (group: MonitoringRecord[]) => {
    if (!group.length) return;

    const record = group[0];
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus semua data monitoring untuk:\n` +
      `Tanggal: ${new Date(record.tanggal).toLocaleDateString('id-ID')}\n` +
      `Line: ${record.line}`
    );

    if (!confirmDelete) return;

    try {
      await deleteMonitoringSession(
        record.plant,
        record.tanggal,
        record.line
      );
      alert('Data berhasil dihapus');
      loadRecords();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Gagal menghapus data');
    }
  };

  const handleEdit = (group: MonitoringRecord[]) => {
    if (!group.length) return;
    const record = group[0];
    navigate('/create-monitoring', {
      state: {
        plant: record.plant,
        tanggal: record.tanggal,
        line: record.line,
        editMode: true
      }
    });
  };

  const handlePreview = async (group: MonitoringRecord[]) => {
    if (!group.length) return;
    const record = group[0];
    const recordsWithPhotos = await getMonitoringRecordsWithPhotos(
      record.plant,
      record.tanggal,
      record.line
    );
    setPreviewRecords(recordsWithPhotos);
    setPreviewModal(true);
  };

  const handleExportExcel = async (group: MonitoringRecord[]) => {
    if (!group.length) return;
    const record = group[0];
    const recordsWithPhotos = await getMonitoringRecordsWithPhotos(
      record.plant,
      record.tanggal,
      record.line
    );
    await exportMonitoringToExcel(recordsWithPhotos, record.plant, record.line);
  };

  const handleExportPDF = async (group: MonitoringRecord[]) => {
    if (!group.length) return;
    const record = group[0];
    const recordsWithPhotos = await getMonitoringRecordsWithPhotos(
      record.plant,
      record.tanggal,
      record.line
    );
    await exportMonitoringToPDF(recordsWithPhotos, record.plant, record.line);
  };

  const handleExportAllExcel = async () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }
    await exportAllMonitoringToExcel(filteredRecords, selectedPlant);
  };

  const handleDeleteAllFiltered = async () => {
    const currentUser = authService.getCurrentUser();
    console.log('Current user:', currentUser);
    console.log('User permissions:', currentUser?.permissions);
    console.log('Has delete_monitoring_records?', authService.hasPermission('delete_monitoring_records'));

    if (!authService.hasPermission('delete_monitoring_records')) {
      alert('Anda tidak memiliki izin untuk menghapus data monitoring. Silakan logout dan login kembali jika permission baru saja ditambahkan.');
      return;
    }

    if (filteredRecords.length === 0) {
      alert('Tidak ada data yang difilter');
      return;
    }

    const confirmed = window.confirm(`Hapus ${filteredRecords.length} data yang difilter?`);
    if (!confirmed) return;

    try {
      const recordIds = filteredRecords.map(r => r.id);
      await deleteMultipleMonitoringRecords(recordIds);
      alert(`${filteredRecords.length} data berhasil dihapus`);
      loadRecords();
    } catch (error) {
      console.error('Error deleting filtered records:', error);
      alert('Gagal menghapus data');
    }
  };

  const getSessionAreas = (group: MonitoringRecord[]) => {
    const areas = [...new Set(group.map(r => r.area))];
    return areas;
  };

  const getSessionStatus = (group: MonitoringRecord[]) => {
    const completeCount = group.filter(r => r.status === 'complete').length;
    return completeCount === group.length ? 'complete' : 'draft';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const groupedRecords = groupRecordsBySession(filteredRecords);
  const paginatedGroups = getPaginatedGroups(groupedRecords);
  const totalPages = Math.ceil(groupedRecords.length / itemsPerPage);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: 'white', fontSize: '16px' }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/plant-selection-monitoring')}
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '12px',
            marginBottom: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <ArrowLeft size={24} color="#f97316" />
        </button>

        <button
          onClick={handleCreateClick}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
          }}
        >
          <Plus size={20} />
          Tambah Data
        </button>

        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px', textAlign: 'center' }}>
            Monitoring Records
          </h1>

          <p style={{ fontSize: '18px', color: '#718096', marginBottom: '32px', textAlign: 'left', fontWeight: '600' }}>
            {selectedPlant}
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
              Filter by Date
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
                  Tanggal Awal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid #fed7aa',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid #fed7aa',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
              Filter by Line
            </label>
            <div
              onClick={() => setShowLineDropdown(!showLineDropdown)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #fed7aa',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{selectedLines.length === 0 ? 'Semua Line' : `${selectedLines.length} Line dipilih`}</span>
              <span style={{ transform: showLineDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {showLineDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '2px solid #fed7aa',
                borderRadius: '12px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {lines.map(line => (
                  <div
                    key={line}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedLines.includes(line)) {
                        setSelectedLines(selectedLines.filter(l => l !== line));
                      } else {
                        setSelectedLines([...selectedLines, line]);
                      }
                    }}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: selectedLines.includes(line) ? '#ffedd5' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLines.includes(line)}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredRecords.length > 0 && authService.hasPermission('delete_monitoring_records') && (
            <button
              onClick={handleDeleteAllFiltered}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '24px',
              }}
            >
              <Trash2 size={18} />
              Delete All Filtered Records ({filteredRecords.length})
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={handleExportAllExcel}
              style={{
                padding: '14px',
                background: 'white',
                border: '2px solid #10b981',
                borderRadius: '12px',
                color: '#10b981',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FileDown size={18} />
              Export All Excel
            </button>
            <button
              style={{
                padding: '14px',
                background: 'white',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FileDown size={18} />
              Export All PDF
            </button>
          </div>
        </div>

        {paginatedGroups.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '24px', padding: '48px 32px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#718096' }}>Belum ada data monitoring</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {paginatedGroups.map((group, idx) => {
                const record = group[0];
                const areas = getSessionAreas(group);
                const status = getSessionStatus(group);
                const areaDataCounts = areas.map(area => {
                  const count = group.filter(r => r.area === area).length;
                  return { area, count };
                });

                return (
                  <div key={idx} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderLeft: '4px solid #f97316' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>
                          {record.line}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#718096' }}>
                          {formatDate(record.tanggal)}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: status === 'complete' ? '#d1fae5' : '#fef3c7',
                        color: status === 'complete' ? '#065f46' : '#92400e'
                      }}>
                        {status === 'complete' ? 'Complete' : 'Draft'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      {areaDataCounts.map(({ area, count }) => (
                        <div key={area} style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600' }}>Area: {area}</span> ({count} data tersimpan)
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                      Dibuat oleh: {record.created_by}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => handlePreview(group)}
                        style={{
                          padding: '10px',
                          background: 'white',
                          border: '2px solid #3b82f6',
                          borderRadius: '8px',
                          color: '#3b82f6',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleExportExcel(group)}
                        style={{
                          padding: '10px',
                          background: 'white',
                          border: '2px solid #10b981',
                          borderRadius: '8px',
                          color: '#10b981',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <FileDown size={16} />
                        Excel
                      </button>
                      <button
                        onClick={() => handleExportPDF(group)}
                        style={{
                          padding: '10px',
                          background: 'white',
                          border: '2px solid #ef4444',
                          borderRadius: '8px',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <FileDown size={16} />
                        PDF
                      </button>
                      <button
                        onClick={() => handleEdit(group)}
                        style={{
                          padding: '10px',
                          background: '#f97316',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      {authService.hasPermission('delete_monitoring_records') && (
                        <button
                          onClick={() => handleDeleteSession(group)}
                          style={{
                            gridColumn: '1 / -1',
                            padding: '10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                          Del
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '12px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreatePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              Pilih Line dan Tanggal
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                Tanggal
              </label>
              <input
                type="date"
                value={tempTanggal}
                onChange={(e) => setTempTanggal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #fed7aa',
                  fontSize: '16px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                Line
              </label>
              <select
                value={tempLine}
                onChange={(e) => setTempLine(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #fed7aa',
                  fontSize: '16px',
                }}
              >
                <option value="">Pilih Line</option>
                {lines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowCreatePopup(false)}
                style={{
                  padding: '14px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleCreateConfirm}
                style={{
                  padding: '14px',
                  background: '#f97316',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {previewModal && (
        <div
          onClick={() => setPreviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setPreviewModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                zIndex: 1
              }}
            >
              <X size={24} />
            </button>

            {previewRecords.length > 0 && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '12px' }}>
                  Preview Data Monitoring
                </h2>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                  <p><strong>Line:</strong> {previewRecords[0].line}</p>
                  <p><strong>Tanggal:</strong> {new Date(previewRecords[0].tanggal).toLocaleDateString('id-ID')}</p>
                </div>

                {/* Group by area */}
                {Object.entries(
                  previewRecords.reduce((acc, record) => {
                    if (!acc[record.area]) acc[record.area] = [];
                    acc[record.area].push(record);
                    return acc;
                  }, {} as { [area: string]: MonitoringRecord[] })
                ).map(([area, areaRecords]) => (
                  <div key={area} style={{ marginBottom: '32px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#f97316',
                      marginBottom: '16px',
                      paddingBottom: '8px',
                      borderBottom: '2px solid #fed7aa'
                    }}>
                      Area: {area}
                    </h3>

                    {areaRecords.sort((a, b) => a.data_number - b.data_number).map((record, idx) => (
                      <div key={idx} style={{
                        background: '#fff7ed',
                        border: '2px solid #fed7aa',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontWeight: '600', color: '#1a202c', marginBottom: '8px', fontSize: '16px' }}>
                          Data ke-{record.data_number}
                        </div>

                        {record.keterangan && (
                          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
                            <strong>Keterangan:</strong> {record.keterangan}
                          </p>
                        )}

                        {record.foto_url && (
                          <div>
                            <button
                              onClick={() => setPreviewImage(record.foto_url)}
                              style={{
                                padding: '8px 16px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Eye size={16} />
                              Lihat Foto
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: '12px'
              }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringRecordsScreen;

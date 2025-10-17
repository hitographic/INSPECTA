import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, FileDown, Trash2, Eye, X } from 'lucide-react';
import { KlipingRecord } from '../types/database';
import { getKlipingRecords, getKlipingRecordsWithPhotos, getKlipingRecordPhotos, REGU_OPTIONS, SHIFT_OPTIONS, FOTO_TYPES } from '../utils/klipingDatabase';
import { exportKlipingToExcel, exportKlipingToPDF, exportAllKlipingToZip } from '../utils/klipingExport';
import { supabase } from '../utils/supabase';
import { PLANTS } from '../constants/AppConstants';
import { getUserPermissions } from '../utils/authService';

interface LocationState {
  plant: string;
}

const KlipingRecordsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plant } = (location.state as LocationState) || { plant: 'Plant-1' };

  const [records, setRecords] = useState<KlipingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<KlipingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedRegu, setSelectedRegu] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [tempLine, setTempLine] = useState('');
  const [tempRegu, setTempRegu] = useState('');
  const [tempShift, setTempShift] = useState('');

  const [photoPreviewModal, setPhotoPreviewModal] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<{ [key: string]: string }>({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [canPreviewPhotos, setCanPreviewPhotos] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const lines = PLANTS[plant as keyof typeof PLANTS]?.map(num => `Line ${num}`) || [];

  useEffect(() => {
    loadRecords();
    checkPermissions();
  }, [plant]);

  useEffect(() => {
    console.log('[KLIPING SCREEN] Applying filters, records count:', records.length);
    console.log('[KLIPING SCREEN] Filters:', { startDate, endDate, selectedLine, selectedRegu, selectedShift });
    applyFilters();
    setCurrentPage(1);
  }, [records, startDate, endDate, selectedLine, selectedRegu, selectedShift]);

  const checkPermissions = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.username) {
      const permissions = await getUserPermissions(currentUser.username);
      setCanPreviewPhotos(permissions.includes('preview_kliping_photos'));
    }
  };

  const groupRecordsBySession = (records: KlipingRecord[]) => {
    const grouped: { [key: string]: KlipingRecord[] } = {};

    records.forEach(record => {
      const key = `${record.tanggal}_${record.line}_${record.regu}_${record.shift}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    return Object.values(grouped).map(group => group.sort((a, b) => {
      if (a.Pengamatan_ke && b.Pengamatan_ke) {
        return parseInt(a.Pengamatan_ke) - parseInt(b.Pengamatan_ke);
      }
      return 0;
    }));
  };

  const getPaginatedGroups = (groups: KlipingRecord[][]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groups.slice(startIndex, endIndex);
  };

  const getTotalPages = (groups: KlipingRecord[][]) => {
    return Math.ceil(groups.length / itemsPerPage);
  };

  const loadRecords = async () => {
    try {
      console.log('[KLIPING SCREEN] Starting loadRecords for plant:', plant);
      setLoading(true);

      const data = await getKlipingRecords({ plant });

      console.log('[KLIPING SCREEN] Received data:', data);
      console.log('[KLIPING SCREEN] Data length:', data?.length);
      console.log('[KLIPING SCREEN] Sample record:', data?.[0]);

      setRecords(data);
      setLoading(false);

      console.log('[KLIPING SCREEN] State updated, records count:', data.length);
    } catch (error) {
      console.error('[KLIPING SCREEN] Error in loadRecords:', error);
      setLoading(false);
      alert('Error loading records: ' + error);
    }
  };

  const canDelete = (): boolean => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role || 'user';
        return ['admin', 'manager', 'supervisor'].includes(role.toLowerCase());
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const applyFilters = () => {
    let filtered = [...records];
    console.log('[KLIPING SCREEN] Before filter:', filtered.length);

    if (startDate) {
      console.log('[KLIPING SCREEN] Applying startDate filter:', startDate);
      filtered = filtered.filter(r => r.tanggal >= startDate);
      console.log('[KLIPING SCREEN] After startDate filter:', filtered.length);
    }

    if (endDate) {
      console.log('[KLIPING SCREEN] Applying endDate filter:', endDate);
      filtered = filtered.filter(r => r.tanggal <= endDate);
      console.log('[KLIPING SCREEN] After endDate filter:', filtered.length);
    }

    if (selectedLine) {
      console.log('[KLIPING SCREEN] Applying line filter:', selectedLine);
      filtered = filtered.filter(r => r.line === selectedLine);
      console.log('[KLIPING SCREEN] After line filter:', filtered.length);
    }

    if (selectedRegu) {
      console.log('[KLIPING SCREEN] Applying regu filter:', selectedRegu);
      filtered = filtered.filter(r => r.regu === selectedRegu);
      console.log('[KLIPING SCREEN] After regu filter:', filtered.length);
    }

    if (selectedShift) {
      console.log('[KLIPING SCREEN] Applying shift filter:', selectedShift);
      filtered = filtered.filter(r => r.shift === selectedShift);
      console.log('[KLIPING SCREEN] After shift filter:', filtered.length);
    }

    console.log('[KLIPING SCREEN] Final filtered count:', filtered.length);
    setFilteredRecords(filtered);
  };

  const handleCreateNew = () => {
    setTempLine('');
    setTempRegu('');
    setTempShift('');
    setShowCreatePopup(true);
  };

  const handleConfirmCreate = async () => {
    if (!tempLine || !tempRegu || !tempShift) {
      alert('Harap pilih Line, Regu, dan Shift terlebih dahulu!');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const existingRecord = records.find(r =>
      r.tanggal === today &&
      r.line === tempLine &&
      r.regu === tempRegu &&
      r.shift === tempShift
    );

    if (existingRecord) {
      alert(`Data untuk Line ${tempLine}, Regu ${tempRegu}, Shift ${tempShift} pada tanggal hari ini sudah ada!\n\nSilakan edit data yang sudah ada atau pilih kombinasi Line, Regu, Shift yang berbeda.`);
      return;
    }

    setShowCreatePopup(false);
    navigate('/create-kliping', {
      state: {
        plant,
        line: tempLine,
        regu: tempRegu,
        shift: tempShift,
      },
    });
  };

  const handleExportAllExcel = async () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }

    alert('Memuat foto untuk export... Mohon tunggu');

    const recordsWithPhotos = await getKlipingRecordsWithPhotos({
      plant,
      startDate,
      endDate,
      line: selectedLine || undefined
    });

    const sessions = groupRecordsBySession(recordsWithPhotos);

    if (sessions.length > 1) {
      const success = await exportAllKlipingToZip(recordsWithPhotos, 'excel');
      if (success) {
        alert(`Export berhasil! ${sessions.length} file Excel dalam ZIP`);
      } else {
        alert('Export gagal!');
      }
    } else {
      const success = await exportKlipingToExcel(recordsWithPhotos);
      if (success) {
        alert('Export Excel berhasil!');
      } else {
        alert('Export Excel gagal!');
      }
    }
  };

  const handleExportAllPDF = async () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }

    alert('Memuat foto untuk export... Mohon tunggu');

    const recordsWithPhotos = await getKlipingRecordsWithPhotos({
      plant,
      startDate,
      endDate,
      line: selectedLine || undefined
    });

    const sessions = groupRecordsBySession(recordsWithPhotos);

    if (sessions.length > 1) {
      const success = await exportAllKlipingToZip(recordsWithPhotos, 'pdf');
      if (success) {
        alert(`Export berhasil! ${sessions.length} file PDF dalam ZIP`);
      } else {
        alert('Export gagal!');
      }
    } else {
      const success = await exportKlipingToPDF(recordsWithPhotos);
      if (success) {
        alert('Export PDF berhasil!');
      } else {
        alert('Export PDF gagal!');
      }
    }
  };

  const handlePreviewPhotos = async (record: KlipingRecord, pengamatanKe: string, mesin: string) => {
    if (!canPreviewPhotos) {
      alert('Anda tidak memiliki akses untuk preview foto');
      return;
    }

    setLoadingPhotos(true);
    setPhotoPreviewModal(true);

    try {
      const photos = await getKlipingRecordPhotos({
        plant: record.plant,
        tanggal: record.tanggal,
        line: record.line,
        regu: record.regu,
        shift: record.shift,
        Pengamatan_ke: pengamatanKe,
        Mesin: mesin
      });

      if (photos) {
        setPreviewPhotos(photos as { [key: string]: string });
      } else {
        setPreviewPhotos({});
        alert('Tidak ada foto untuk mesin ini');
      }
    } catch (error) {
      console.error('[PREVIEW] Error loading photos:', error);
      alert('Gagal memuat foto');
      setPreviewPhotos({});
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleExportRecordExcel = async (record: KlipingRecord) => {
    alert('Memuat foto untuk export... Mohon tunggu');

    const recordsWithPhotos = await getKlipingRecordsWithPhotos({
      plant,
      startDate: record.tanggal,
      endDate: record.tanggal,
      line: record.line,
      regu: record.regu,
      shift: record.shift
    });

    const success = await exportKlipingToExcel(recordsWithPhotos);
    if (success) {
      alert('Export Excel berhasil!');
    } else {
      alert('Export Excel gagal!');
    }
  };

  const handleExportRecordPDF = async (record: KlipingRecord) => {
    alert('Memuat foto untuk export... Mohon tunggu');

    const recordsWithPhotos = await getKlipingRecordsWithPhotos({
      plant,
      startDate: record.tanggal,
      endDate: record.tanggal,
      line: record.line,
      regu: record.regu,
      shift: record.shift
    });

    const success = await exportKlipingToPDF(recordsWithPhotos);
    if (success) {
      alert('Export PDF berhasil!');
    } else {
      alert('Export PDF gagal!');
    }
  };

  const handleDeleteAll = async () => {
    if (!canDelete()) {
      alert('Anda tidak memiliki akses untuk menghapus data');
      return;
    }

    if (!confirm('Hapus SEMUA data kliping untuk plant ini? Tindakan ini tidak bisa dibatalkan!')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kliping_records')
        .delete()
        .eq('plant', plant);

      if (error) throw error;

      alert('Semua data berhasil dihapus');
      await loadRecords();
    } catch (error) {
      console.error('Error deleting all records:', error);
      alert('Gagal menghapus data');
    }
  };

  const handleDeleteRecord = async (recordId: number, tanggal: string) => {
    if (!canDelete()) {
      alert('Anda tidak memiliki akses untuk menghapus data');
      return;
    }

    if (!confirm(`Hapus data tanggal ${formatDate(tanggal)}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kliping_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      alert('Data berhasil dihapus');
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Gagal menghapus data');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };


  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/plant-selection-kliping')}
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
          <ArrowLeft size={24} color="#10b981" />
        </button>

        <button
          onClick={handleCreateNew}
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

        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px', textAlign: 'center' }}>
            Kliping Records
          </h1>

          <p style={{ fontSize: '18px', color: '#718096', marginBottom: '32px', textAlign: 'left', fontWeight: '600' }}>
            {plant}
          </p>

          {canDelete() && (
            <button
              onClick={handleDeleteAll}
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
              Delete All Records
            </button>
          )}

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
                    border: '2px solid #d1fae5',
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
                    border: '2px solid #d1fae5',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
              Filter by Line
            </label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #d1fae5',
                fontSize: '14px',
              }}
            >
              <option value="">Semua Line</option>
              {lines.map(line => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
              Filter by Regu
            </label>
            <select
              value={selectedRegu}
              onChange={(e) => setSelectedRegu(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #d1fae5',
                fontSize: '14px',
              }}
            >
              <option value="">Semua Regu</option>
              {REGU_OPTIONS.map(regu => (
                <option key={regu} value={regu}>{regu}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
              Filter by Shift
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #d1fae5',
                fontSize: '14px',
              }}
            >
              <option value="">Semua Shift</option>
              {SHIFT_OPTIONS.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <button
              onClick={handleExportAllExcel}
              style={{
                flex: 1,
                padding: '14px',
                background: 'white',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                color: '#16a34a',
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
              onClick={handleExportAllPDF}
              style={{
                flex: 1,
                padding: '14px',
                background: 'white',
                border: '2px solid #dc2626',
                borderRadius: '12px',
                color: '#dc2626',
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              Loading records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              Tidak ada data kliping
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const allGroups = groupRecordsBySession(filteredRecords);
                  const paginatedGroups = getPaginatedGroups(allGroups);
                  const totalPages = getTotalPages(allGroups);

                  return (
                    <>
                      {paginatedGroups.map((group, groupIdx) => {
                const firstRecord = group[0];
                return (
                  <div
                    key={groupIdx}
                    style={{
                      background: '#f0fdf4',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '2px solid #bbf7d0',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>
                          {firstRecord.line} - Regu {firstRecord.regu} - Shift {firstRecord.shift}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#047857', marginBottom: '8px' }}>
                          {formatDate(firstRecord.tanggal)}
                        </p>
                        <div style={{ fontSize: '14px', color: '#065f46', marginTop: '8px' }}>
                          {(() => {
                            const pengamatanMap: { [key: string]: { flavor: string; mesins: string[] } } = {};

                            group.forEach(record => {
                              const key = record.Pengamatan_ke || '';
                              if (!pengamatanMap[key]) {
                                pengamatanMap[key] = {
                                  flavor: record.Flavor || '',
                                  mesins: []
                                };
                              }

                              const mesinNum = record.Mesin?.replace('Mesin ', '') || '';
                              if (mesinNum && !pengamatanMap[key].mesins.includes(mesinNum)) {
                                pengamatanMap[key].mesins.push(mesinNum);
                              }
                            });

                            return Object.entries(pengamatanMap)
                              .sort(([a], [b]) => parseInt(a) - parseInt(b))
                              .map(([pengNum, data]) => (
                                <div key={pengNum} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                                  <p style={{ marginBottom: '8px', fontWeight: '600' }}>
                                    Pengamatan {pengNum}: {data.flavor}
                                  </p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {data.mesins.sort((a, b) => parseInt(a) - parseInt(b)).map(mesinNum => (
                                      <button
                                        key={mesinNum}
                                        onClick={() => canPreviewPhotos && handlePreviewPhotos(firstRecord, pengNum, `Mesin ${mesinNum}`)}
                                        disabled={!canPreviewPhotos}
                                        style={{
                                          padding: '6px 12px',
                                          background: canPreviewPhotos ? '#10b981' : '#9ca3af',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          fontSize: '12px',
                                          fontWeight: '500',
                                          cursor: canPreviewPhotos ? 'pointer' : 'not-allowed',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Eye size={14} />
                                        Mesin {mesinNum}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                          Dibuat oleh: {firstRecord.created_by}
                        </p>
                      </div>
                      <div style={{
                        background: firstRecord.is_complete ? '#10b981' : '#f59e0b',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {firstRecord.is_complete ? 'Complete' : 'Draft'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleExportRecordExcel(firstRecord)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'white',
                        border: '1px solid #16a34a',
                        borderRadius: '8px',
                        color: '#16a34a',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <FileDown size={14} />
                      Excel
                    </button>
                      <button
                        onClick={() => handleExportRecordPDF(firstRecord)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'white',
                        border: '1px solid #dc2626',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <FileDown size={14} />
                      PDF
                    </button>
                      <button
                        onClick={() => navigate('/create-kliping', {
                          state: {
                            plant,
                            line: firstRecord.line,
                            regu: firstRecord.regu,
                            shift: firstRecord.shift,
                            sessionId: `${firstRecord.tanggal}_${firstRecord.line}_${firstRecord.regu}_${firstRecord.shift}`
                          }
                        })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      {canDelete() && (
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus semua pengamatan untuk ${firstRecord.line} - Regu ${firstRecord.regu} - Shift ${firstRecord.shift}?`)) {
                              for (const record of group) {
                                if (record.id) {
                                  await handleDeleteRecord(record.id, record.tanggal);
                                }
                              }
                              loadRecords();
                            }
                          }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                    </div>
                  </div>
                );
              })}

                      {totalPages > 1 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '32px',
                          paddingTop: '24px',
                          borderTop: '2px solid #d1fae5'
                        }}>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: '10px 16px',
                              background: currentPage === 1 ? '#e5e7eb' : '#10b981',
                              color: currentPage === 1 ? '#9ca3af' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Previous
                          </button>

                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center'
                          }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    style={{
                                      padding: '8px 12px',
                                      background: page === currentPage ? '#10b981' : 'white',
                                      color: page === currentPage ? 'white' : '#065f46',
                                      border: `2px solid ${page === currentPage ? '#10b981' : '#d1fae5'}`,
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      minWidth: '40px'
                                    }}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                              ) {
                                return <span key={page} style={{ padding: '0 4px', color: '#6b7280' }}>...</span>;
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              padding: '10px 16px',
                              background: currentPage === totalPages ? '#e5e7eb' : '#10b981',
                              color: currentPage === totalPages ? '#9ca3af' : 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Next
                          </button>

                          <div style={{
                            marginLeft: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            Page {currentPage} of {totalPages} ({allGroups.length} total records)
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
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
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1a202c' }}>
              Pilih Line, Regu, dan Shift
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2d3748' }}>
                Line
              </label>
              <select
                value={tempLine}
                onChange={(e) => setTempLine(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #d1fae5',
                  fontSize: '16px',
                }}
              >
                <option value="">Pilih Line</option>
                {lines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2d3748' }}>
                Regu
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {REGU_OPTIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTempRegu(r)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: tempRegu === r ? '#10b981' : '#f7fafc',
                      color: tempRegu === r ? 'white' : '#2d3748',
                      border: '2px solid',
                      borderColor: tempRegu === r ? '#10b981' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2d3748' }}>
                Shift
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {SHIFT_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTempShift(s)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: tempShift === s ? '#10b981' : '#f7fafc',
                      color: tempShift === s ? 'white' : '#2d3748',
                      border: '2px solid',
                      borderColor: tempShift === s ? '#10b981' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCreatePopup(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: (tempLine && tempRegu && tempShift) ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (tempLine && tempRegu && tempShift) ? 'pointer' : 'not-allowed',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {photoPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'white',
              padding: '20px',
              borderBottom: '2px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#065f46', margin: 0 }}>
                Preview Foto
              </h2>
              <button
                onClick={() => setPhotoPreviewModal(false)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {loadingPhotos ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#10b981' }}>
                  <p style={{ fontSize: '18px', fontWeight: '600' }}>⏳ Loading foto...</p>
                </div>
              ) : Object.keys(previewPhotos).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                  <p style={{ fontSize: '16px' }}>Tidak ada foto</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {FOTO_TYPES.map(fotoType => {
                    const fotoData = previewPhotos[fotoType.key];
                    if (!fotoData) return null;

                    return (
                      <div key={fotoType.key} style={{
                        background: '#f9fafb',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '12px'
                        }}>
                          {fotoType.label}
                        </h3>
                        <div style={{
                          width: '100%',
                          aspectRatio: '4/3',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#e5e7eb'
                        }}>
                          <img
                            src={fotoData}
                            alt={fotoType.label}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div style="display:flex;align-items:center;justify-center;height:100%;color:#9ca3af;font-size:14px;">Failed to load</div>';
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KlipingRecordsScreen;

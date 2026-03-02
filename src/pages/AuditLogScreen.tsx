import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Download } from 'lucide-react';
import { getAuditLogs } from '../utils/auditLog';
import { authService } from '../utils/authService';
import ExcelJS from 'exceljs';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  affected_count: number;
  deleted_by: string;
  deleted_at: string;
  action: string;
  plant: string;
  additional_info: any;
}

const AuditLogScreen: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTable, setFilterTable] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    const role = currentUser.role?.toLowerCase();
    if (role !== 'admin' && role !== 'manager') {
      alert('Akses ditolak! Hanya Admin dan Manager yang dapat melihat audit log.');
      navigate('/menu');
      return;
    }

    loadAuditLogs();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [logs, filterTable, filterUser, filterPlant, filterStartDate, filterEndDate]);

  const loadAuditLogs = async () => {
    try {
      console.log('[AUDIT LOG SCREEN] Loading audit logs...');
      setLoading(true);
      const data = await getAuditLogs({ limit: 1000 });
      console.log('[AUDIT LOG SCREEN] Received data:', data?.length || 0, 'records');
      console.log('[AUDIT LOG SCREEN] First log:', data?.[0]);
      setLogs(data);
    } catch (error) {
      console.error('[AUDIT LOG SCREEN] Failed to load audit logs:', error);
      alert('Gagal memuat audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filterTable) {
      filtered = filtered.filter(log => log.table_name === filterTable);
    }

    if (filterUser) {
      filtered = filtered.filter(log =>
        log.deleted_by.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    if (filterPlant) {
      filtered = filtered.filter(log => log.plant === filterPlant);
    }

    if (filterStartDate) {
      filtered = filtered.filter(log =>
        new Date(log.deleted_at) >= new Date(filterStartDate)
      );
    }

    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log =>
        new Date(log.deleted_at) <= endDate
      );
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setFilterTable('');
    setFilterUser('');
    setFilterPlant('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Audit Logs');

      worksheet.columns = [
        { header: 'Tanggal & Waktu', key: 'deleted_at', width: 20 },
        { header: 'Tabel', key: 'table_name', width: 20 },
        { header: 'Action', key: 'action', width: 15 },
        { header: 'Jumlah Data', key: 'affected_count', width: 12 },
        { header: 'Dihapus Oleh', key: 'deleted_by', width: 25 },
        { header: 'Plant', key: 'plant', width: 12 },
        { header: 'Record ID', key: 'record_id', width: 30 },
        { header: 'Info Tambahan', key: 'additional_info', width: 40 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10b981' }
      };

      filteredLogs.forEach(log => {
        worksheet.addRow({
          deleted_at: new Date(log.deleted_at).toLocaleString('id-ID'),
          table_name: log.table_name,
          action: log.action,
          affected_count: log.affected_count,
          deleted_by: log.deleted_by,
          plant: log.plant || '-',
          record_id: log.record_id,
          additional_info: JSON.stringify(log.additional_info)
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export ke Excel');
    }
  };

  const getTableDisplayName = (tableName: string) => {
    switch (tableName) {
      case 'sanitation_records': return 'Sanitation';
      case 'kliping_records': return 'Kliping';
      case 'monitoring_records': return 'Monitoring';
      default: return tableName;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE': return '#ef4444';
      case 'BULK_DELETE': return '#dc2626';
      case 'BULK_DELETE_SESSION': return '#b91c1c';
      case 'BULK_DELETE_MULTIPLE': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const uniqueTables = Array.from(new Set(logs.map(log => log.table_name)));
  const uniquePlants = Array.from(new Set(logs.map(log => log.plant).filter(Boolean)));

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      padding: '20px'
    }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          background: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '12px',
          marginBottom: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <ArrowLeft size={24} color="#10b981" />
      </button>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px 0' }}>
              Audit Log
            </h1>
            <p style={{ fontSize: '16px', color: '#718096', margin: 0 }}>
              Riwayat penghapusan data
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: showFilters ? '#10b981' : 'white',
                color: showFilters ? 'white' : '#10b981',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Filter size={20} />
              Filter
            </button>
            <button
              onClick={exportToExcel}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={20} />
              Export Excel
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{
            background: '#f7fafc',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                Tabel
              </label>
              <select
                value={filterTable}
                onChange={(e) => setFilterTable(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">Semua</option>
                {uniqueTables.map(table => (
                  <option key={table} value={table}>{getTableDisplayName(table)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                Plant
              </label>
              <select
                value={filterPlant}
                onChange={(e) => setFilterPlant(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">Semua</option>
                {uniquePlants.map(plant => (
                  <option key={plant} value={plant}>{plant}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                User
              </label>
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Cari nama user..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#718096' }}>
          Menampilkan {filteredLogs.length} dari {logs.length} log
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Waktu</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Tabel</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Action</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Dihapus Oleh</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Plant</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Info</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#718096' }}>
                    Tidak ada audit log
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(log.deleted_at).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>
                      {getTableDisplayName(log.table_name)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: getActionColor(log.action),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {log.deleted_by}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {log.plant || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#718096' }}>
                      {log.additional_info?.line && `Line ${log.additional_info.line}`}
                      {log.additional_info?.tanggal && ` | ${log.additional_info.tanggal}`}
                      {log.affected_count > 1 && ` (${log.affected_count} records)`}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailModal(true);
                        }}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedLog && (
        <div
          style={{
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
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: 0 }}>
                Detail Audit Log
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Tabel</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{getTableDisplayName(selectedLog.table_name)}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Action</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedLog.action}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Dihapus Oleh</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedLog.deleted_by}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Waktu</div>
                <div style={{ fontSize: '16px' }}>
                  {new Date(selectedLog.deleted_at).toLocaleString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Plant</div>
                <div style={{ fontSize: '16px' }}>{selectedLog.plant || '-'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '12px' }}>
                Jumlah Data yang Terpengaruh:
              </div>
              <div style={{
                background: '#f7fafc',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '700',
                color: '#10b981',
                textAlign: 'center'
              }}>
                {selectedLog.affected_count} {selectedLog.affected_count === 1 ? 'record' : 'records'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogScreen;

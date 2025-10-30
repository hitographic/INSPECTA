import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Trash2, Eye, Edit, X, ChevronDown, ChevronUp } from 'lucide-react';
import { MonitoringRecord, saveMonitoringRecord, getMonitoringRecords, AREA_OPTIONS } from '../utils/monitoringDatabase';
import { CameraManager } from '../utils/camera';
import { sortAreasByDisplayOrder } from '../utils/masterData';

interface LocationState {
  plant: string;
  tanggal: string;
  line: string;
  regu: string;
  shift: string;
  editMode?: boolean;
}

interface DataEntry {
  data_number: number;
  foto_url: string | null;
  keterangan: string;
  id?: string;
}

interface AreaData {
  area: string;
  entries: DataEntry[];
  expanded: boolean;
}

const CreateMonitoringScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [plant] = useState(state?.plant || 'Plant-1');
  const [tanggal] = useState(state?.tanggal || new Date().toISOString().split('T')[0]);
  const [line] = useState(state?.line || 'Line 1');
  const [regu] = useState(state?.regu || 'A');
  const [shift] = useState(state?.shift || '1');

  const [selectedArea, setSelectedArea] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [currentDataNumber, setCurrentDataNumber] = useState(1);
  const [currentFoto, setCurrentFoto] = useState<string | null>(null);
  const [currentKeterangan, setCurrentKeterangan] = useState('');
  const [showDataForm, setShowDataForm] = useState(false);

  const [savedAreas, setSavedAreas] = useState<AreaData[]>([]);
  const [saving, setSaving] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<{areaIndex: number, entryIndex: number} | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraManager = useRef<CameraManager | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    if (state?.editMode) {
      loadExistingData();
    }
  }, []);

  const loadExistingData = async () => {
    try {
      const records = await getMonitoringRecords(plant, {
        startDate: tanggal,
        endDate: tanggal,
        lines: [line],
        regus: [regu],
        shifts: [shift]
      });

      const areaMap: { [area: string]: DataEntry[] } = {};

      records.forEach(record => {
        if (!areaMap[record.area]) {
          areaMap[record.area] = [];
        }
        areaMap[record.area].push({
          id: record.id,
          data_number: record.data_number,
          foto_url: record.foto_url,
          keterangan: record.keterangan || ''
        });
      });

      const areaNames = Object.keys(areaMap);
      const sortedAreaNames = await sortAreasByDisplayOrder(areaNames);

      const areasData: AreaData[] = sortedAreaNames.map(area => ({
        area,
        entries: areaMap[area].sort((a, b) => a.data_number - b.data_number),
        expanded: true
      }));

      setSavedAreas(areasData);
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const handleGenerate = () => {
    const existingArea = savedAreas.find(a => a.area === selectedArea);
    if (existingArea) {
      const maxDataNumber = Math.max(...existingArea.entries.map(e => e.data_number), 0);
      setCurrentDataNumber(maxDataNumber + 1);
    } else {
      setCurrentDataNumber(1);
    }
    setCurrentFoto(null);
    setCurrentKeterangan('');
    setShowDataForm(true);
    setEditingEntry(null);
  };

  const handleTambahDataBaru = () => {
    if (!currentFoto) {
      alert('Silakan ambil atau upload foto terlebih dahulu');
      return;
    }

    if (editingEntry !== null) {
      // Update existing entry
      const updatedAreas = [...savedAreas];
      updatedAreas[editingEntry.areaIndex].entries[editingEntry.entryIndex] = {
        ...updatedAreas[editingEntry.areaIndex].entries[editingEntry.entryIndex],
        foto_url: currentFoto,
        keterangan: currentKeterangan
      };
      setSavedAreas(updatedAreas);
      setEditingEntry(null);
    } else {
      // Add new entry
      const existingAreaIndex = savedAreas.findIndex(a => a.area === selectedArea);

      if (existingAreaIndex >= 0) {
        const updatedAreas = [...savedAreas];
        updatedAreas[existingAreaIndex].entries.push({
          data_number: currentDataNumber,
          foto_url: currentFoto,
          keterangan: currentKeterangan
        });
        setSavedAreas(updatedAreas);
      } else {
        setSavedAreas([...savedAreas, {
          area: selectedArea,
          entries: [{
            data_number: currentDataNumber,
            foto_url: currentFoto,
            keterangan: currentKeterangan
          }],
          expanded: true
        }]);
      }
    }

    setCurrentDataNumber(prev => prev + 1);
    setCurrentFoto(null);
    setCurrentKeterangan('');
    alert('Data berhasil ditambahkan!');
  };

  const handleEditEntry = (areaIndex: number, entryIndex: number) => {
    const entry = savedAreas[areaIndex].entries[entryIndex];
    setSelectedArea(savedAreas[areaIndex].area);
    setCurrentDataNumber(entry.data_number);
    setCurrentFoto(entry.foto_url);
    setCurrentKeterangan(entry.keterangan);
    setEditingEntry({ areaIndex, entryIndex });
    setShowDataForm(true);
  };

  const handleDeleteEntry = (areaIndex: number, entryIndex: number) => {
    if (confirm('Hapus data ini?')) {
      const updatedAreas = [...savedAreas];
      updatedAreas[areaIndex].entries.splice(entryIndex, 1);

      if (updatedAreas[areaIndex].entries.length === 0) {
        updatedAreas.splice(areaIndex, 1);
      }

      setSavedAreas(updatedAreas);
    }
  };

  const handleToggleArea = (areaIndex: number) => {
    const updatedAreas = [...savedAreas];
    updatedAreas[areaIndex].expanded = !updatedAreas[areaIndex].expanded;
    setSavedAreas(updatedAreas);
  };

  const handleCameraClick = async () => {
    setCameraVisible(true);
    setCameraError('');

    // Wait for video element to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (!videoRef.current) {
        setCameraError('Video element tidak tersedia');
        return;
      }
      cameraManager.current = new CameraManager();
      const success = await cameraManager.current.startCamera(videoRef.current);
      if (!success) {
        setCameraError('Gagal mengakses kamera');
      }
    } catch (error: any) {
      setCameraError(error.message || 'Gagal mengakses kamera');
    }
  };

  const handleCapture = async () => {
    if (!cameraManager.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraManager.current.capturePhoto();
      setCurrentFoto(photo);
      handleCloseCamera();
    } catch (error: any) {
      alert('Gagal mengambil foto: ' + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCloseCamera = () => {
    if (cameraManager.current) {
      cameraManager.current.stopCamera();
      cameraManager.current = null;
    }
    setCameraVisible(false);
    setCameraError('');
  };

  const handleUploadClick = () => {
    uploadRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Compress to max 800x800
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCurrentFoto(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSimpanSementara = async () => {
    if (savedAreas.length === 0) {
      alert('Tidak ada data untuk disimpan');
      return;
    }

    setSaving(true);
    try {
      for (const areaData of savedAreas) {
        for (const entry of areaData.entries) {
          if (entry.id) {
            continue;
          }

          const record: Partial<MonitoringRecord> = {
            plant,
            tanggal,
            line,
            regu,
            shift,
            area: areaData.area,
            data_number: entry.data_number,
            foto_url: entry.foto_url,
            keterangan: entry.keterangan,
            status: 'draft',
            created_by: currentUser.name || currentUser.username
          };

          await saveMonitoringRecord(record);
        }
      }

      alert('Data tersimpan sebagai draft!');
      navigate('/monitoring-records', { state: { selectedPlant: plant } });
    } catch (error: any) {
      alert('Error menyimpan data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSimpanSemua = async () => {
    if (savedAreas.length === 0) {
      alert('Tidak ada data untuk disimpan');
      return;
    }

    setSaving(true);
    try {
      for (const areaData of savedAreas) {
        for (const entry of areaData.entries) {
          if (entry.id) {
            continue;
          }

          const record: Partial<MonitoringRecord> = {
            plant,
            tanggal,
            line,
            regu,
            shift,
            area: areaData.area,
            data_number: entry.data_number,
            foto_url: entry.foto_url,
            keterangan: entry.keterangan,
            status: 'complete',
            created_by: currentUser.name || currentUser.username
          };

          await saveMonitoringRecord(record);
        }
      }

      alert('Semua data berhasil disimpan!');
      navigate('/monitoring-records', { state: { selectedPlant: plant } });
    } catch (error: any) {
      alert('Error menyimpan data: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/monitoring-records', { state: { selectedPlant: plant } })}
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <ArrowLeft size={24} color="#f97316" />
        </button>

        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '8px',
            color: '#1a202c'
          }}>Create Monitoring</h1>
          <p style={{
            textAlign: 'center',
            color: '#718096',
            marginBottom: '24px'
          }}>{plant}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>Tanggal</label>
              <div style={{
                width: '100%',
                padding: '14px',
                background: '#f7fafc',
                border: '2px solid #fed7aa',
                borderRadius: '12px',
                color: '#2d3748',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {new Date(tanggal).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>Line</label>
                <div style={{
                  padding: '14px',
                  background: '#ffedd5',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#1a202c'
                }}>
                  {line}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>Regu</label>
                <div style={{
                  padding: '14px',
                  background: '#ffedd5',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#1a202c'
                }}>
                  {regu}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>Shift</label>
                <div style={{
                  padding: '14px',
                  background: '#ffedd5',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#1a202c'
                }}>
                  {shift}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>Area</label>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #fed7aa',
                    borderRadius: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{
                    color: selectedArea ? '#1a202c' : '#9ca3af',
                    fontWeight: selectedArea ? '600' : '400'
                  }}>
                    {selectedArea || 'Pilih Area'}
                  </span>
                  <span style={{ color: '#9ca3af' }}>▼</span>
                </button>
                {showAreaDropdown && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    width: '100%',
                    marginTop: '8px',
                    background: 'white',
                    border: '2px solid #fed7aa',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    maxHeight: '256px',
                    overflowY: 'auto'
                  }}>
                    {AREA_OPTIONS.map(area => (
                      <button
                        key={area}
                        onClick={() => {
                          setSelectedArea(area);
                          setShowAreaDropdown(false);
                          setShowDataForm(false);
                          setEditingEntry(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px',
                          textAlign: 'left',
                          background: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ffedd5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedArea && !showDataForm && (
              <div>
                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>Generate untuk mengambil foto</p>
                <button
                  onClick={handleGenerate}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '18px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        </div>

        {showDataForm && selectedArea && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '16px',
              color: '#1a202c'
            }}>Data ke-{currentDataNumber}</h3>

            {!currentFoto ? (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#ef4444',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  background: '#fee2e2',
                  borderRadius: '8px'
                }}>⚠ Foto belum diambil</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <button
                    onClick={handleCameraClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px 24px',
                      background: '#dbeafe',
                      border: '2px dashed #60a5fa',
                      color: '#2563eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
                  >
                    <Camera size={20} />
                    Ambil Foto
                  </button>
                  <button
                    onClick={handleUploadClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px 24px',
                      background: '#dbeafe',
                      border: '2px dashed #60a5fa',
                      color: '#2563eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
                  >
                    <Upload size={20} />
                    Upload Foto
                  </button>
                </div>
                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  padding: '16px',
                  background: '#ecfdf5',
                  border: '2px solid #6ee7b7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#10b981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Camera size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#065f46' }}>Foto tersimpan</div>
                      <div style={{ fontSize: '12px', color: '#059669' }}>Klik Preview untuk melihat</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPreviewImage(currentFoto)}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    <button
                      onClick={() => setCurrentFoto(null)}
                      style={{
                        padding: '8px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
              }}>Keterangan</label>
              <textarea
                value={currentKeterangan}
                onChange={(e) => setCurrentKeterangan(e.target.value)}
                placeholder="Masukkan keterangan"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  fontSize: '16px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                rows={4}
              />
            </div>

            <button
              onClick={handleTambahDataBaru}
              disabled={saving}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: saving ? '#9ca3af' : '#fbbf24',
                color: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '18px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(251,191,36,0.3)'
              }}
              onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#f59e0b')}
              onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#fbbf24')}
            >
              {editingEntry !== null ? 'Update Data' : 'Tambah Data Baru'}
            </button>
          </div>
        )}

        {savedAreas.length > 0 && savedAreas.map((areaData, areaIndex) => (
          <div key={areaIndex} style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => handleToggleArea(areaIndex)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                padding: '0 0 12px 0',
                marginBottom: '16px',
                borderBottom: '2px solid #ffedd5',
                cursor: 'pointer'
              }}
            >
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1a202c',
                margin: 0
              }}>
                Area: {areaData.area} ({areaData.entries.length} data)
              </h3>
              {areaData.expanded ? <ChevronUp size={24} color="#f97316" /> : <ChevronDown size={24} color="#f97316" />}
            </button>

            {areaData.expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {areaData.entries.map((entry, entryIndex) => (
                <div key={entryIndex} style={{
                  padding: '16px',
                  background: '#fff7ed',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1a202c', fontSize: '16px' }}>
                      Data ke-{entry.data_number}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {entry.foto_url && (
                        <button
                          onClick={() => setPreviewImage(entry.foto_url)}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '600'
                          }}
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => handleEditEntry(areaIndex, entryIndex)}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(areaIndex, entryIndex)}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {entry.keterangan && (
                    <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>
                      {entry.keterangan}
                    </p>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        ))}

        {savedAreas.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <button
              onClick={handleSimpanSementara}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'white',
                border: '2px solid #d1d5db',
                color: '#374151',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Simpan Sementara
            </button>
            <button
              onClick={handleSimpanSemua}
              disabled={saving}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: saving ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '18px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {saving ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        )}
      </div>

      {cameraVisible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '20px'
            }}>
              {cameraError ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 0'
                }}>
                  <p style={{
                    color: '#dc2626',
                    marginBottom: '16px',
                    fontSize: '16px'
                  }}>{cameraError}</p>
                  <button
                    onClick={handleCloseCamera}
                    style={{
                      padding: '12px 24px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      marginBottom: '16px',
                      background: '#000'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleCapture}
                      disabled={isCapturing}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        background: isCapturing ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isCapturing ? 'not-allowed' : 'pointer',
                        opacity: isCapturing ? 0.6 : 1,
                        fontWeight: '700',
                        fontSize: '18px'
                      }}
                    >
                      {isCapturing ? 'Mengambil...' : 'Ambil Foto'}
                    </button>
                    <button
                      onClick={handleCloseCamera}
                      style={{
                        padding: '16px 24px',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '18px'
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}
            </div>
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

export default CreateMonitoringScreen;

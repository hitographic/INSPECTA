import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Eye, Trash2, Edit, X } from 'lucide-react';
import { KlipingRecord } from '../types/database';
import {
  insertKlipingRecord,
  getKlipingRecords,
  deleteKlipingRecordsByIdUnik,
  getKlipingRecordPhotos,
  MESIN_OPTIONS,
  FOTO_TYPES
} from '../utils/klipingDatabase';
import { CameraManager } from '../utils/camera';

interface LocationState {
  plant: string;
  line: string;
  regu: string;
  shift: string;
  tanggal?: string;
  sessionId?: string;
}

interface MesinFotos {
  [mesin: string]: {
    [fotoKey: string]: string;
  };
}

interface PengamatanData {
  number: string;
  flavor: string;
  mesins: string[];
  timestamp: string;
  mesinFotos: MesinFotos;
}

const CreateKlipingScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [plant] = useState(state?.plant || 'Plant-1');
  const [line] = useState(state?.line || 'Line 1');
  const [regu] = useState(state?.regu || 'A');
  const [shift] = useState(state?.shift || '1');
  const [tanggal, setTanggal] = useState(state?.tanggal || new Date().toISOString().split('T')[0]);

  const [pengamatan, setPengamatan] = useState('');
  const [flavor, setFlavor] = useState('');
  const [selectedMesin, setSelectedMesin] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [showMesinFoto, setShowMesinFoto] = useState(false);
  const [isFlavorLocked, setIsFlavorLocked] = useState(false);

  const [mesinFotos, setMesinFotos] = useState<MesinFotos>({});
  const [currentMesin, setCurrentMesin] = useState('');

  const [savedPengamatans, setSavedPengamatans] = useState<PengamatanData[]>([]);
  const [usedPengamatanNumbers, setUsedPengamatanNumbers] = useState<string[]>([]);
  const [editingPengamatanIndex, setEditingPengamatanIndex] = useState<number | null>(null);
  const [modifiedPengamatanKeys, setModifiedPengamatanKeys] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [currentFotoKey, setCurrentFotoKey] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [photoPreviewModal, setPhotoPreviewModal] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<{ [key: string]: string }>({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [mesinPhotoCounts, setMesinPhotoCounts] = useState<{ [key: string]: number }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManager = useRef(new CameraManager());
  const uploadRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (state?.sessionId) {
      loadExistingSession();
    }
  }, []);

  useEffect(() => {
    loadExistingSession();
  }, [tanggal]);

  useEffect(() => {
    Object.keys(mesinFotos).forEach(mesin => {
      updatePhotoCount(mesin, mesinFotos[mesin]);
    });
  }, [mesinFotos]);

  useEffect(() => {
    if (selectedMesin && pengamatan) {
      if (!mesinFotos[selectedMesin]) {
        fetchExistingPhotosForMesin(selectedMesin);
      } else {
        // Update count if mesinFotos already exists
        updatePhotoCount(selectedMesin, mesinFotos[selectedMesin]);
      }
    }
  }, [selectedMesin]);

  const loadExistingSession = async () => {
    setSavedPengamatans([]);
    setUsedPengamatanNumbers([]);
    setPengamatan('');
    setFlavor('');
    setMesinFotos({});
    setShowMesinFoto(false);
    setIsFlavorLocked(false);
    setMesinPhotoCounts({});
    setModifiedPengamatanKeys(new Set());

    const records = await getKlipingRecords({
      plant,
      startDate: tanggal,
      endDate: tanggal,
      line,
      regu,
      shift
    });

    if (records.length === 0) return;

    const pengamatanMap: { [key: string]: PengamatanData } = {};

    records.forEach(record => {
      const pengNum = record.Pengamatan_ke || '';
      const flav = record.Flavor || '';
      const mes = record.Mesin || '';

      if (!pengNum || !flav || !mes) return;

      const key = `${pengNum}_${flav}`;

      if (!pengamatanMap[key]) {
        pengamatanMap[key] = {
          number: pengNum,
          flavor: flav,
          mesins: [],
          timestamp: record.pengamatan_timestamp || '',
          mesinFotos: {}
        };
      }

      if (!pengamatanMap[key].mesins.includes(mes)) {
        pengamatanMap[key].mesins.push(mes);
      }

      // Initialize empty mesinFotos - will be loaded on-demand
      if (!pengamatanMap[key].mesinFotos[mes]) {
        pengamatanMap[key].mesinFotos[mes] = {};
      }
    });

    const loadedPengamatans = Object.values(pengamatanMap).map(peng => ({
      ...peng,
      mesins: sortMesins(peng.mesins)
    }));
    setSavedPengamatans(loadedPengamatans);
    setUsedPengamatanNumbers(loadedPengamatans.map(p => p.number));

    // Load photo counts in background (fast - just count, no photo data)
    loadedPengamatans.forEach(peng => {
      peng.mesins.forEach(async (mesin) => {
        await loadPhotoCountForMesin(peng.number, peng.flavor, mesin);
      });
    });
  };

  const handlePengamatanChange = (value: string) => {
    setPengamatan(value);

    if (value) {
      const existingPeng = savedPengamatans.find(p => p.number === value);
      if (existingPeng) {
        setFlavor(existingPeng.flavor);
        setIsFlavorLocked(true);
      } else {
        setIsFlavorLocked(false);
        if (flavor && isFlavorLocked) {
          setFlavor('');
        }
      }
    } else {
      setIsFlavorLocked(false);
    }
  };

  const isPengamatanAlreadySaved = () => {
    return savedPengamatans.some(p => p.number === pengamatan);
  };

  const sortMesins = (mesins: string[]): string[] => {
    return [...mesins].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  };

  const handleGenerate = () => {
    if (!pengamatan || !flavor) {
      alert('Mohon isi Pengamatan dan Flavor terlebih dahulu!');
      return;
    }

    if (isPengamatanAlreadySaved()) {
      alert('Pengamatan ini sudah tersimpan! Gunakan tombol Edit di card untuk mengubah data.');
      return;
    }

    const ts = new Date().toISOString();
    setTimestamp(ts);
    setShowMesinFoto(true);
    setSelectedMesin('');
  };

  const openCamera = async (mesin: string, fotoKey: string) => {
    setCurrentMesin(mesin);
    setCurrentFotoKey(fotoKey);
    setCameraVisible(true);
    setCameraError('');
    setIsCapturing(false);

    setTimeout(async () => {
      if (videoRef.current) {
        const success = await cameraManager.current.startCamera(videoRef.current);
        if (!success) {
          setCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
        }
      }
    }, 100);
  };

  const takePicture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);
    setCameraError('');

    try {
      const photoDataUrl = await cameraManager.current.capturePhoto();

      if (photoDataUrl && currentMesin) {
        setMesinFotos(prev => {
          const updated = {
            ...prev,
            [currentMesin]: {
              ...(prev[currentMesin] || {}),
              [currentFotoKey]: photoDataUrl
            }
          };
          updatePhotoCount(currentMesin, updated[currentMesin]);
          return updated;
        });
        closeCamera();
      } else {
        setCameraError('Gagal mengambil foto. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      setCameraError('Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setIsCapturing(false);
    }
  };

  const closeCamera = () => {
    cameraManager.current.stopCamera();
    setCameraVisible(false);
    setCurrentFotoKey('');
    setCurrentMesin('');
    setCameraError('');
    setIsCapturing(false);
  };

  const handleUploadFoto = (mesin: string, fotoKey: string) => {
    const refKey = `${mesin}_${fotoKey}`;
    uploadRefs.current[refKey]?.click();
  };

  const handleFileChange = async (mesin: string, fotoKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const processedImage = await cameraManager.current.processUploadedImage(file);
      if (processedImage) {
        setMesinFotos(prev => {
          const updated = {
            ...prev,
            [mesin]: {
              ...(prev[mesin] || {}),
              [fotoKey]: processedImage
            }
          };
          updatePhotoCount(mesin, updated[mesin]);
          return updated;
        });
      } else {
        alert('Gagal memproses gambar');
      }
    } catch (error) {
      console.error('Error processing uploaded image:', error);
      alert('Gagal memproses gambar');
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleSavePengamatan = () => {
    if (!pengamatan || !flavor || !timestamp) {
      alert('Data pengamatan belum lengkap!');
      return;
    }

    const mesinsWithFotos = Object.keys(mesinFotos).filter(mesin => {
      const fotos = mesinFotos[mesin];
      return fotos && Object.values(fotos).some(Boolean);
    });

    if (mesinsWithFotos.length === 0) {
      alert('Minimal 1 mesin harus memiliki foto!');
      return;
    }

    const pengamatanKey = `${pengamatan}_${flavor}`;
    setModifiedPengamatanKeys(prev => new Set(prev).add(pengamatanKey));

    if (editingPengamatanIndex !== null) {
      const cleanedMesinFotos: MesinFotos = {};
      mesinsWithFotos.forEach(mesin => {
        cleanedMesinFotos[mesin] = JSON.parse(JSON.stringify(mesinFotos[mesin] || {}));
      });

      const newPengamatan: PengamatanData = {
        number: pengamatan,
        flavor: flavor,
        mesins: sortMesins(mesinsWithFotos),
        timestamp: timestamp,
        mesinFotos: cleanedMesinFotos
      };

      setSavedPengamatans(prev => {
        const updated = [...prev];
        updated[editingPengamatanIndex] = newPengamatan;
        return updated;
      });
      setEditingPengamatanIndex(null);
      alert(`Pengamatan ${pengamatan} berhasil diupdate!`);
    } else {
      const existingIndex = savedPengamatans.findIndex(
        p => p.number === pengamatan && p.flavor === flavor
      );

      if (existingIndex !== -1) {
        const existing = savedPengamatans[existingIndex];
        const allMesins = sortMesins(Array.from(new Set([...existing.mesins, ...mesinsWithFotos])));
        const mergedMesinFotos = { ...existing.mesinFotos };

        mesinsWithFotos.forEach(mesin => {
          mergedMesinFotos[mesin] = JSON.parse(JSON.stringify(mesinFotos[mesin] || {}));
        });

        console.log('Merging mesin data:', {
          existing: existing.mesins,
          new: mesinsWithFotos,
          result: allMesins
        });

        setSavedPengamatans(prev => {
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            mesins: allMesins,
            mesinFotos: mergedMesinFotos
          };
          console.log('Updated pengamatans:', updated[existingIndex]);
          return updated;
        });
        alert(`Data mesin berhasil ditambahkan ke Pengamatan ${pengamatan} Flavor ${flavor}!`);
      } else {
        const newPengamatan: PengamatanData = {
          number: pengamatan,
          flavor: flavor,
          mesins: sortMesins(mesinsWithFotos),
          timestamp: timestamp,
          mesinFotos: JSON.parse(JSON.stringify(mesinFotos))
        };

        setSavedPengamatans(prev => [...prev, newPengamatan]);
        setUsedPengamatanNumbers(prev => [...prev, pengamatan]);
        alert(`Pengamatan ${pengamatan} Flavor ${flavor} berhasil disimpan!`);
      }
    }

    setPengamatan('');
    setFlavor('');
    setSelectedMesin('');
    setTimestamp('');
    setShowMesinFoto(false);
    setMesinFotos({});
    setIsFlavorLocked(false);
  };


  const getCurrentUser = () => {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        return user.full_name || user.username || 'Unknown';
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return 'Unknown';
  };

  const updatePhotoCount = (mesin: string, mesinFotosData: { [fotoKey: string]: string }) => {
    const count = Object.values(mesinFotosData || {}).filter(Boolean).length;
    setMesinPhotoCounts(prev => ({
      ...prev,
      [mesin]: count
    }));
  };

  const getPhotoCountForMesin = (mesin: string): string => {
    const count = mesinPhotoCounts[mesin] || 0;
    const total = FOTO_TYPES.length;
    return `${count}/${total} foto`;
  };

  const loadPhotoCountForMesin = async (pengamatanNum: string, _flavorVal: string, mesin: string) => {
    try {
      const photos = await getKlipingRecordPhotos({
        plant,
        tanggal,
        line,
        regu,
        shift,
        Pengamatan_ke: pengamatanNum,
        Mesin: mesin
      });

      if (photos) {
        let count = 0;
        FOTO_TYPES.forEach(ft => {
          const val = (photos as any)[ft.key];
          if (val) {
            count++;
          }
        });

        if (count > 0) {
          setMesinPhotoCounts(prev => ({
            ...prev,
            [mesin]: count
          }));
        }
      }
    } catch (error) {
      console.error('[COUNT] Error loading photo count for mesin:', error);
    }
  };

  const fetchExistingPhotosForMesin = async (mesin: string) => {
    if (!pengamatan || !flavor) return;

    try {
      const photos = await getKlipingRecordPhotos({
        plant,
        tanggal,
        line,
        regu,
        shift,
        Pengamatan_ke: pengamatan,
        Mesin: mesin
      });

      if (photos) {
        const photoData: { [key: string]: string } = {};
        let count = 0;
        FOTO_TYPES.forEach(ft => {
          const val = (photos as any)[ft.key];
          if (val) {
            photoData[ft.key] = val;
            count++;
          }
        });

        // Update mesinFotos state with actual photo data
        setMesinFotos(prev => ({
          ...prev,
          [mesin]: photoData
        }));

        // Update count
        setMesinPhotoCounts(prev => ({
          ...prev,
          [mesin]: count
        }));
      }
    } catch (error) {
      console.error('[FETCH] Error fetching existing photos for mesin:', error);
    }
  };

  const handlePreviewPhotos = async (pengamatanData: PengamatanData, mesin: string) => {
    setLoadingPhotos(true);
    setPhotoPreviewModal(true);
    setPreviewPhotos({});

    const filters = {
      plant,
      tanggal,
      line,
      regu,
      shift,
      Pengamatan_ke: pengamatanData.number,
      Mesin: mesin
    };

    console.log('[PREVIEW] Fetching photos with filters:', filters);

    try {
      const photos = await getKlipingRecordPhotos(filters);

      console.log('[PREVIEW] Photos received:', photos);

      if (photos) {
        const photoData: { [key: string]: string } = {};
        FOTO_TYPES.forEach(ft => {
          const val = (photos as any)[ft.key];
          if (val) {
            console.log(`[PREVIEW] Found photo for ${ft.key}`);
            photoData[ft.key] = val;
          }
        });
        console.log('[PREVIEW] Total photos found:', Object.keys(photoData).length);
        setPreviewPhotos(photoData);

        if (Object.keys(photoData).length === 0) {
          alert('Tidak ada foto yang tersimpan untuk mesin ini');
        }
      } else {
        console.log('[PREVIEW] No photos returned from query');
        alert('Foto tidak ditemukan atau belum diupload');
      }
    } catch (error) {
      console.error('[PREVIEW] Error loading photos:', error);
      alert('Gagal memuat foto');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleEditPengamatan = async (index: number) => {
    const peng = savedPengamatans[index];
    setLoadingEdit(true);

    setPengamatan(peng.number);
    setFlavor(peng.flavor);
    setTimestamp(peng.timestamp);
    setEditingPengamatanIndex(index);
    setShowMesinFoto(true);
    setSelectedMesin('');
    setIsFlavorLocked(true);

    try {
      // Load foto data untuk semua mesin di pengamatan ini
      const loadedMesinFotos: MesinFotos = {};
      for (const mesin of peng.mesins) {
        try {
          const photos = await getKlipingRecordPhotos({
            plant,
            tanggal,
            line,
            regu,
            shift,
            Pengamatan_ke: peng.number,
            Mesin: mesin
          });

          if (photos) {
            const photoData: { [key: string]: string } = {};
            let count = 0;
            FOTO_TYPES.forEach(ft => {
              const val = (photos as any)[ft.key];
              if (val) {
                photoData[ft.key] = val;
                count++;
              }
            });
            loadedMesinFotos[mesin] = photoData;

            // Update count
            setMesinPhotoCounts(prev => ({
              ...prev,
              [mesin]: count
            }));
          }
        } catch (error) {
          console.error('[EDIT] Error loading photos for mesin:', mesin, error);
          loadedMesinFotos[mesin] = {};
        }
      }

      setMesinFotos(loadedMesinFotos);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeletePengamatan = (index: number) => {
    const peng = savedPengamatans[index];
    if (confirm(`Hapus Pengamatan ${peng.number}: ${peng.flavor}?`)) {
      setSavedPengamatans(prev => prev.filter((_, i) => i !== index));
      const remainingPengamatans = savedPengamatans.filter((_, i) => i !== index);
      const usedNumbers = remainingPengamatans.map(p => p.number);
      setUsedPengamatanNumbers(usedNumbers);
    }
  };

  const handleSimpanSemua = async () => {
    if (savedPengamatans.length === 0) {
      alert('Belum ada pengamatan yang disimpan!');
      return;
    }

    if (!state?.sessionId) {
      const existingRecords = await getKlipingRecords({
        startDate: tanggal,
        endDate: tanggal,
        line,
        regu,
        shift
      });

      if (existingRecords.length > 0) {
        alert(`Data untuk Line ${line}, Regu ${regu}, Shift ${shift} pada tanggal ${tanggal} sudah ada!\n\nSilakan edit data yang sudah ada atau pilih kombinasi yang berbeda.`);
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    try {
      const lineNumber = line.replace('Line ', '');
      const dateObj = new Date(tanggal);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;

      console.log('Saving all pengamatans:', savedPengamatans);
      console.log('Modified pengamatan keys:', Array.from(modifiedPengamatanKeys));

      for (const peng of savedPengamatans) {
        const pengamatanKey = `${peng.number}_${peng.flavor}`;
        const isModified = modifiedPengamatanKeys.has(pengamatanKey);

        if (!isModified) {
          console.log(`Skipping unmodified pengamatan ${peng.number}: ${peng.flavor}`);
          continue;
        }

        const idUnik = `${peng.flavor}${lineNumber}${regu}${shift}${dateStr}P${peng.number}`;

        console.log(`Processing modified pengamatan ${peng.number} ${peng.flavor}:`, {
          mesins: peng.mesins,
          mesinFotos: Object.keys(peng.mesinFotos)
        });

        console.log(`Deleting old records with id_unik: ${idUnik}`);
        const deleteResult = await deleteKlipingRecordsByIdUnik(idUnik);
        if (!deleteResult.success) {
          console.error(`Failed to delete old records: ${deleteResult.error}`);
        }

        const sortedMesins = sortMesins(peng.mesins);
        for (const mesin of sortedMesins) {
          const record: any = {
            id_unik: idUnik,
            plant,
            tanggal,
            line,
            regu,
            shift,
            Pengamatan_ke: peng.number,
            Flavor: peng.flavor,
            Mesin: mesin,
            pengamatan_timestamp: peng.timestamp,
            created_by: getCurrentUser(),
            is_complete: true
          };

          const mesinFotosForThisMesin = peng.mesinFotos[mesin] || {};
          FOTO_TYPES.forEach(ft => {
            record[ft.key] = mesinFotosForThisMesin[ft.key] || null;
          });

          console.log(`Inserting record for mesin ${mesin}:`, record);

          const result = await insertKlipingRecord(record as KlipingRecord, true);
          if (!result.success) {
            alert(`Gagal menyimpan data: ${result.error}`);
            setSaving(false);
            return;
          }

          console.log(`Successfully inserted mesin ${mesin}`);
        }
      }

      alert('Semua data berhasil disimpan!');
      navigate('/kliping-records', { state: { plant } });
    } catch (error) {
      console.error('Error saving records:', error);
      alert('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (cameraVisible) {
    return (
      <div className="camera-container">
        {cameraError && (
          <div className="camera-error">
            {cameraError}
          </div>
        )}

        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '1.125rem',
          fontWeight: '600',
          zIndex: 10
        }}>
          {FOTO_TYPES.find(f => f.key === currentFotoKey)?.label || 'Ambil Foto'}
        </div>

        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />

        <div className="camera-overlay">
          <button
            className="capture-button"
            onClick={takePicture}
            disabled={isCapturing || !!cameraError}
          >
            <div className={`capture-button-inner ${isCapturing ? 'capturing' : ''}`} />
          </button>

          {isCapturing && (
            <div style={{ color: 'white', marginTop: '0.5rem' }}>
              Mengambil foto...
            </div>
          )}

          <button
            className="cancel-button"
            onClick={closeCamera}
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/kliping-records', { state: { plant } })}
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
          <ArrowLeft size={24} color="#10b981" />
        </button>

        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '8px',
            color: '#1a202c'
          }}>
            Create Kliping
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#718096',
            marginBottom: '24px'
          }}>
            {plant}
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748' }}>
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid #10b981',
                fontSize: '16px',
                background: 'white'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>
              💡 Ubah tanggal untuk melihat/edit data tanggal lain
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>
                Line
              </label>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#d1fae5',
                textAlign: 'center',
                fontWeight: '600',
                color: '#065f46'
              }}>
                {line}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>
                Regu
              </label>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#d1fae5',
                textAlign: 'center',
                fontWeight: '600',
                color: '#065f46'
              }}>
                {regu}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>
                Shift
              </label>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#d1fae5',
                textAlign: 'center',
                fontWeight: '600',
                color: '#065f46'
              }}>
                {shift}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>
                Pengamatan
              </label>
              <select
                value={pengamatan}
                onChange={(e) => handlePengamatanChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Pilih</option>
                <option value="1">1 {usedPengamatanNumbers.includes('1') ? '✓' : ''}</option>
                <option value="2">2 {usedPengamatanNumbers.includes('2') ? '✓' : ''}</option>
                <option value="3">3 {usedPengamatanNumbers.includes('3') ? '✓' : ''}</option>
                <option value="4">4 {usedPengamatanNumbers.includes('4') ? '✓' : ''}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2d3748', fontSize: '14px' }}>
                Flavor {isFlavorLocked && <span style={{ fontSize: '12px', color: '#10b981' }}>(Auto-filled)</span>}
              </label>
              <input
                type="text"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                placeholder="Masukkan flavor"
                disabled={isFlavorLocked}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px',
                  background: isFlavorLocked ? '#f3f4f6' : 'white',
                  cursor: isFlavorLocked ? 'not-allowed' : 'text',
                  color: isFlavorLocked ? '#6b7280' : '#2d3748'
                }}
              />
            </div>
          </div>

          {isPengamatanAlreadySaved() && (
            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ Pengamatan {pengamatan} sudah tersimpan. Gunakan tombol <strong>Edit</strong> di card untuk mengubah data.
            </div>
          )}

          <p style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic', marginBottom: '12px' }}>
            Generate untuk mengambil foto
          </p>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!pengamatan || !flavor || isPengamatanAlreadySaved()}
            style={{
              width: '100%',
              padding: '14px',
              background: (!pengamatan || !flavor || isPengamatanAlreadySaved()) ? '#cbd5e0' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (!pengamatan || !flavor || isPengamatanAlreadySaved()) ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {isPengamatanAlreadySaved() ? 'Pengamatan Sudah Tersimpan' : 'Generate'}
          </button>

          {showMesinFoto && (
            <>
              <div style={{
                background: '#f0fdf4',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '2px solid #bbf7d0'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#16a34a',
                  marginBottom: '12px'
                }}>
                  Pilih Mesin untuk Input/Lihat Foto:
                </p>
                {loadingEdit && (
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ fontSize: '13px', color: '#16a34a' }}>⏳ Loading foto...</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {MESIN_OPTIONS.map(mesin => {
                    const isSelected = selectedMesin === mesin;
                    const photoCountText = getPhotoCountForMesin(mesin);

                    return (
                      <button
                        key={mesin}
                        type="button"
                        onClick={() => setSelectedMesin(mesin)}
                        style={{
                          padding: '12px',
                          background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                          color: isSelected ? 'white' : '#2d3748',
                          border: isSelected ? 'none' : '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{mesin}</span>
                        <span style={{ fontSize: '12px', opacity: 0.9 }}>
                          {photoCountText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMesin && (
                <div style={{
                  background: '#f7fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📸 Input Foto: {selectedMesin}
                  </h3>

              {FOTO_TYPES.map(fotoType => {
                const currentFotos = mesinFotos[selectedMesin] || {};
                const fotoValue = currentFotos[fotoType.key] || '';

                return (
                  <div key={fotoType.key} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '4px' }}>
                      {fotoType.label}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
                      {fotoType.description}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={() => openCamera(selectedMesin, fotoType.key)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Camera size={18} />
                        Ambil Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadFoto(selectedMesin, fotoType.key)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: 'white',
                          border: '2px dashed #48bb78',
                          borderRadius: '12px',
                          color: '#48bb78',
                          fontSize: '15px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Upload size={18} />
                        Upload Foto
                      </button>
                      <input
                        ref={el => uploadRefs.current[`${selectedMesin}_${fotoType.key}`] = el}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(selectedMesin, fotoType.key, e)}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {fotoValue && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(fotoValue)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            color: '#16a34a',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Eye size={16} />
                          Preview Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus foto ini?')) {
                              setMesinFotos(prev => {
                                const updated = {
                                  ...prev,
                                  [selectedMesin]: {
                                    ...(prev[selectedMesin] || {}),
                                    [fotoType.key]: ''
                                  }
                                };
                                updatePhotoCount(selectedMesin, updated[selectedMesin]);
                                return updated;
                              });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Trash2 size={16} />
                          Hapus Foto
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
                </div>
              )}

              <button
                type="button"
                onClick={handleSavePengamatan}
                style={{
                  padding: '16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '20px',
                  width: '100%'
                }}
              >
                💾 {editingPengamatanIndex !== null ? 'Update' : 'Simpan'} Pengamatan Ini
              </button>
            </>
          )}

          {savedPengamatans.length > 0 && (
            <div style={{
              marginTop: '32px',
              marginBottom: '24px',
              padding: '20px',
              background: '#f0fdf4',
              borderRadius: '12px',
              border: '2px solid #bbf7d0'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#065f46', marginBottom: '16px' }}>
                ✅ Pengamatan Tersimpan ({savedPengamatans.length})
              </h3>
              {savedPengamatans.map((peng, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
                      Pengamatan {peng.number}: {peng.flavor}
                    </p>
                    {peng.mesins.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#047857', marginBottom: '6px', fontWeight: '500' }}>
                          Mesin:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {peng.mesins.map((mesin, mIdx) => (
                            <button
                              key={mIdx}
                              onClick={() => handlePreviewPhotos(peng, mesin)}
                              style={{
                                padding: '4px 10px',
                                background: '#ecfdf5',
                                border: '1px solid #10b981',
                                borderRadius: '6px',
                                color: '#065f46',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ecfdf5';
                                e.currentTarget.style.color = '#065f46';
                              }}
                            >
                              <Eye size={12} />
                              {mesin}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                      💡 Untuk menambah mesin, pilih pengamatan & flavor yang sama lalu pilih mesin baru
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditPengamatan(idx)}
                      disabled={loadingEdit}
                      style={{
                        padding: '8px 12px',
                        background: loadingEdit ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loadingEdit ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        opacity: loadingEdit ? 0.7 : 1
                      }}
                    >
                      <Edit size={14} />
                      {loadingEdit ? 'Loading...' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDeletePengamatan(idx)}
                      style={{
                        padding: '8px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      <X size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedPengamatans.length > 0 && (
            <button
              type="button"
              onClick={handleSimpanSemua}
              disabled={saving}
              style={{
                padding: '16px',
                background: saving ? '#cbd5e0' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                width: '100%',
                marginTop: '16px'
              }}
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Semua'}
            </button>
          )}
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
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
            zIndex: 2000,
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
                borderRadius: '8px'
              }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                color: '#2d3748',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {photoPreviewModal && (
        <div
          onClick={() => setPhotoPreviewModal(false)}
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
            zIndex: 3000,
            padding: '20px',
            overflow: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setPhotoPreviewModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ×
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', marginBottom: '20px' }}>
              Preview Foto
            </h2>

            {loadingPhotos ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Loading foto...
              </div>
            ) : Object.keys(previewPhotos).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Tidak ada foto tersedia
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {FOTO_TYPES.map(ft => {
                  const photoData = previewPhotos[ft.key];
                  if (!photoData) return null;

                  return (
                    <div key={ft.key} style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        {ft.label}
                      </p>
                      <img
                        src={photoData}
                        alt={ft.label}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPreviewImage(photoData)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateKlipingScreen;

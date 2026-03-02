import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { insertRecord, initDatabase, getRecordsMetadata, getRecordById, updateRecord } from '../utils/database';
import { AREAS, BAGIAN_BY_AREA, KETERANGAN_TEMPLATES, PLANTS } from '../constants/AppConstants';
import { CameraManager } from '../utils/camera';
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, X, Upload, Eye } from 'lucide-react';
import { getBagianForLine } from '../utils/masterData';
import type { Bagian } from '../utils/masterData';

// Helper function to get current date and time in GMT+7 (WIB) timezone
const getIndonesiaDateTime = (): { date: string; time: string; datetime: Date } => {
  // Create date in Asia/Jakarta timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';

  const date = `${year}-${month}-${day}`;
  const time = `${hour}:${minute}`;

  // Create a proper Date object for this WIB time
  const datetime = new Date(`${date}T${time}:00+07:00`);

  return { date, time, datetime };
};

const getIndonesiaDate = (): string => {
  return getIndonesiaDateTime().date;
};

export default function CreateRecordScreen() {
  const { selectedPlant, selectedLine, setSelectedLine, currentUser, isLoading } = useApp();
  const navigate = useNavigate();
  const [line, setLine] = useState(selectedLine || '');
  const [area, setArea] = useState('');
  const [bagian, setBagian] = useState('');
  const [photoBefore, setPhotoBefore] = useState('');
  const [photoBeforeDate, setPhotoBeforeDate] = useState('');
  const [photoBeforeTime, setPhotoBeforeTime] = useState('');
  const [photoBeforeSource, setPhotoBeforeSource] = useState<'camera' | 'upload' | ''>('');
  const [photoAfter, setPhotoAfter] = useState('');
  const [photoAfterDate, setPhotoAfterDate] = useState('');
  const [photoAfterTime, setPhotoAfterTime] = useState('');
  const [photoAfterSource, setPhotoAfterSource] = useState<'camera' | 'upload' | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(getIndonesiaDate());
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraType, setCameraType] = useState<'before' | 'after'>('before');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showLinePopup, setShowLinePopup] = useState(false);
  const [recordsMetadata, setRecordsMetadata] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dynamicAreas, setDynamicAreas] = useState<string[]>([]);
  const [dynamicBagianByArea, setDynamicBagianByArea] = useState<{[key: string]: Bagian[]}>({});
  const [dynamicKeterangan, setDynamicKeterangan] = useState<{[key: string]: string}>({});
  const [useDynamicData, setUseDynamicData] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManager = useRef(new CameraManager());
  const uploadBeforeRef = useRef<HTMLInputElement>(null);
  const uploadAfterRef = useRef<HTMLInputElement>(null);

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

    initDatabase();
    
    // Check if coming from edit
    const editBagianIndex = localStorage.getItem('editBagianIndex');
    const editRecordData = localStorage.getItem('editRecordData');
    
    if (editBagianIndex && editRecordData) {
      const index = parseInt(editBagianIndex);
      const recordData = JSON.parse(editRecordData);
      
      // Navigate to the correct bagian
      navigateToIndex(index);
      
      // Load the record data
      setArea(recordData.area);
      setBagian(recordData.bagian);
      setPhotoBefore(recordData.photoBeforeUri || '');
      setPhotoBeforeSource('camera');
      const beforeTimestamp = recordData.foto_sebelum_timestamp || '';
      if (beforeTimestamp) {
        const beforeDate = new Date(beforeTimestamp);
        setPhotoBeforeDate(beforeDate.toISOString().split('T')[0]);
        setPhotoBeforeTime(beforeDate.toTimeString().slice(0, 5));
      }
      setPhotoAfter(recordData.photoAfterUri || '');
      setPhotoAfterSource('camera');
      const afterTimestamp = recordData.foto_sesudah_timestamp || '';
      if (afterTimestamp) {
        const afterDate = new Date(afterTimestamp);
        setPhotoAfterDate(afterDate.toISOString().split('T')[0]);
        setPhotoAfterTime(afterDate.toTimeString().slice(0, 5));
      }
      setKeterangan(recordData.keterangan || '');

      // Load tanggal from record if editing, otherwise use current date
      if (recordData.tanggal) {
        setTanggal(recordData.tanggal);
      }

      // Clear the edit data
      localStorage.removeItem('editBagianIndex');
      localStorage.removeItem('editRecordData');
    }
    
    loadMetadata();
  }, [currentUser, selectedPlant, navigate, tanggal, line]);

  // Load existing record data when editing
  useEffect(() => {
    if (area && bagian) {
      loadExistingDataForBagian();
    }
  }, [area, bagian]);

  // Load dynamic master data from database
  useEffect(() => {
    const loadDynamicData = async () => {
      if (!line) {
        console.log('[DYNAMIC_DATA] No line selected yet');
        return;
      }

      try {
        console.log('[DYNAMIC_DATA] Loading data for line:', line);
        const bagianByArea = await getBagianForLine(line);
        console.log('[DYNAMIC_DATA] Bagian by area fetched:', bagianByArea);

        if (Object.keys(bagianByArea).length > 0) {
          const areas = Object.keys(bagianByArea);
          console.log('[DYNAMIC_DATA] Setting dynamic data - Areas:', areas);
          setUseDynamicData(true);
          setDynamicAreas(areas);
          setDynamicBagianByArea(bagianByArea);

          const keteranganMap: {[key: string]: string} = {};
          Object.values(bagianByArea).flat().forEach(bagian => {
            keteranganMap[bagian.name] = bagian.keterangan;
          });
          setDynamicKeterangan(keteranganMap);
          console.log('[DYNAMIC_DATA] Dynamic data loaded successfully. Use dynamic: true');
        } else {
          console.log('[DYNAMIC_DATA] No bagian found for line:', line);
          setUseDynamicData(false);
        }
      } catch (error) {
        console.error('[DYNAMIC_DATA] Error loading dynamic data:', error);
        setUseDynamicData(false);
      }
    };

    loadDynamicData();
  }, [line]);

  const loadMetadata = async () => {
    if (!selectedPlant || !line || !tanggal) return;

    try {
      console.log('[LOAD_META] Fetching metadata:', { selectedPlant, line, tanggal });
      const metadata = await getRecordsMetadata(selectedPlant, line, tanggal);
      console.log('[LOAD_META] Metadata fetched:', metadata.length, 'records');
      setRecordsMetadata(metadata);
    } catch (error) {
      console.error('[LOAD_META] Error:', error);
    }
  };

  const loadExistingDataForBagian = async () => {
    if (!selectedPlant || !line || !area || !bagian || !tanggal) return;

    try {
      const metadata = recordsMetadata.find(r => r.area === area && r.bagian === bagian);

      if (metadata && metadata.id) {
        console.log('[LOAD_EXISTING] Found metadata, fetching full record:', metadata.id);
        const existingRecord = await getRecordById(metadata.id);

        if (existingRecord) {
          setPhotoBefore(existingRecord.photoBeforeUri || existingRecord.foto_sebelum || '');
          setPhotoBeforeSource('camera');
          const beforeTs = existingRecord.foto_sebelum_timestamp || '';
          if (beforeTs) {
            const beforeDate = new Date(beforeTs);
            setPhotoBeforeDate(beforeDate.toISOString().split('T')[0]);
            setPhotoBeforeTime(beforeDate.toTimeString().slice(0, 5));
          }
          setPhotoAfter(existingRecord.photoAfterUri || existingRecord.foto_sesudah || '');
          setPhotoAfterSource('camera');
          const afterTs = existingRecord.foto_sesudah_timestamp || '';
          if (afterTs) {
            const afterDate = new Date(afterTs);
            setPhotoAfterDate(afterDate.toISOString().split('T')[0]);
            setPhotoAfterTime(afterDate.toTimeString().slice(0, 5));
          }
          setKeterangan(existingRecord.keterangan || getActiveKeterangan()[bagian] || '');
        }
      } else {
        setPhotoBefore('');
        setPhotoBeforeSource('');
        setPhotoBeforeDate('');
        setPhotoBeforeTime('');
        setPhotoAfter('');
        setPhotoAfterSource('');
        setPhotoAfterDate('');
        setPhotoAfterTime('');
        setKeterangan(getActiveKeterangan()[bagian] || '');
      }
    } catch (error) {
      console.error('[LOAD_EXISTING] Error:', error);
    }
  };

  const getActiveAreas = () => {
    const result = useDynamicData ? dynamicAreas : AREAS;
    console.log('[GET_ACTIVE] getActiveAreas - useDynamic:', useDynamicData, 'result:', result);
    return result;
  };
  const getActiveBagianByArea = () => {
    const result = useDynamicData ? dynamicBagianByArea : BAGIAN_BY_AREA;
    console.log('[GET_ACTIVE] getActiveBagianByArea - useDynamic:', useDynamicData, 'keys:', Object.keys(result));
    return result;
  };
  const getActiveKeterangan = () => useDynamicData ? dynamicKeterangan : KETERANGAN_TEMPLATES;

  const getTotalBagianCount = () => {
    let total = 0;
    const areas = getActiveAreas();
    const bagianByArea = getActiveBagianByArea();

    areas.forEach(areaItem => {
      const bagianList = useDynamicData
        ? (bagianByArea[areaItem] || [])
        : (bagianByArea[areaItem] || []);
      total += bagianList.length;
    });
    return total;
  };

  const getCurrentBagianIndex = () => {
    let index = 0;
    const areas = getActiveAreas();
    const bagianByArea = getActiveBagianByArea();

    for (const areaItem of areas) {
      const bagianList = useDynamicData
        ? (bagianByArea[areaItem] || [])
        : (bagianByArea[areaItem] || []);

      for (const bagianItem of bagianList) {
        const bagianName = useDynamicData ? (bagianItem as Bagian).name : (bagianItem as string);
        if (areaItem === area && bagianName === bagian) {
          return index;
        }
        index++;
      }
    }
    return -1;
  };

  const getAllBagianList = () => {
    const allBagian: { area: string; bagian: string; index: number }[] = [];
    let index = 0;
    const areas = getActiveAreas();
    const bagianByArea = getActiveBagianByArea();

    areas.forEach(areaItem => {
      const bagianList = useDynamicData
        ? (bagianByArea[areaItem] || [])
        : (bagianByArea[areaItem] || []);

      bagianList.forEach(bagianItem => {
        const bagianName = useDynamicData ? (bagianItem as Bagian).name : (bagianItem as string);
        allBagian.push({ area: areaItem, bagian: bagianName, index });
        index++;
      });
    });
    
    return allBagian;
  };

  const getCompletedBagianSet = () => {
    const completedSet = new Set<string>();
    const partialSet = new Set<string>();
    const allBagian = getAllBagianList();

    allBagian.forEach((bagianItem, index) => {
      const metadata = recordsMetadata.find(r =>
        r.area === bagianItem.area && r.bagian === bagianItem.bagian
      );

      if (metadata) {
        const hasBefore = !!metadata.foto_sebelum_timestamp;
        const hasAfter = !!metadata.foto_sesudah_timestamp;

        if (metadata.status === 'completed' && hasBefore && hasAfter) {
          completedSet.add((index + 1).toString());
        } else if (hasBefore && hasAfter) {
          completedSet.add((index + 1).toString());
        } else if (hasBefore || hasAfter) {
          partialSet.add((index + 1).toString());
        }
      }
    });

    return { completedSet, partialSet };
  };

  const navigateToIndex = (index: number) => {
    const allBagian = getAllBagianList();
    if (index >= 0 && index < allBagian.length) {
      const targetBagian = allBagian[index];
      setArea(targetBagian.area);
      setBagian(targetBagian.bagian);
    }
  };

  const navigateToBagian = (direction: 'prev' | 'next') => {
    const allBagian = getAllBagianList();
    const currentIndex = getCurrentBagianIndex();

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allBagian.length - 1;
    } else {
      newIndex = currentIndex < allBagian.length - 1 ? currentIndex + 1 : 0;
    }

    const newBagian = allBagian[newIndex];
    setArea(newBagian.area);
    setBagian(newBagian.bagian);
  };

  const handleAreaChange = (newArea: string) => {
    setArea(newArea);
    setBagian('');
    setPhotoBefore('');
    setPhotoAfter('');
    setKeterangan('');
  };

  const handleBagianChange = (newBagian: string) => {
    setBagian(newBagian);
  };

  const handleLineSelect = (selectedLine: string) => {
    setLine(selectedLine);
    setSelectedLine(selectedLine);
    setShowLinePopup(false);

    // Reset form when line changes
    setArea('');
    setBagian('');
    setPhotoBefore('');
    setPhotoAfter('');
    setKeterangan('');
  };

  const openCamera = async (type: 'before' | 'after') => {
    setCameraError('');
    setCameraType(type);
    setCameraVisible(true);
    
    setTimeout(async () => {
      if (videoRef.current) {
        console.log('Starting camera...');
        const success = await cameraManager.current.startCamera(videoRef.current);
        if (!success) {
          setCameraError('Tidak dapat mengakses kamera. Pastikan browser memiliki izin kamera dan refresh halaman.');
          setTimeout(() => setCameraVisible(false), 2000);
        } else {
          console.log('Camera started successfully');
        }
      } else {
        setCameraError('Video element tidak tersedia');
        setTimeout(() => setCameraVisible(false), 2000);
      }
    }, 100);
  };

  const takePicture = async () => {
    console.log('Take picture button clicked');
    setIsCapturing(true);
    setCameraError('');
    
    try {
      if (!videoRef.current) {
        setCameraError('Kamera tidak siap');
        setIsCapturing(false);
        return;
      }

      console.log('Attempting to capture photo...');
      const photoData = await cameraManager.current.capturePhoto();
      
      if (photoData) {
        console.log('Photo captured successfully');

        // Get current time in GMT+7 (WIB)
        const { date, time } = getIndonesiaDateTime();

        if (cameraType === 'before') {
          setPhotoBefore(photoData);
          setPhotoBeforeDate(date);
          setPhotoBeforeTime(time);
          setPhotoBeforeSource('camera');
        } else {
          setPhotoAfter(photoData);
          setPhotoAfterDate(date);
          setPhotoAfterTime(time);
          setPhotoAfterSource('camera');
        }
        closeCamera();
      } else {
        console.error('Photo capture returned null');
        setCameraError('Gagal mengambil foto. Tunggu sebentar dan coba lagi.');
      }
    } catch (error) {
      console.error('Take picture error:', error);
      setCameraError('Terjadi kesalahan saat mengambil foto. Coba lagi.');
    } finally {
      setIsCapturing(false);
    }
  };

  const closeCamera = () => {
    console.log('Closing camera...');
    cameraManager.current.stopCamera();
    setCameraVisible(false);
    setIsCapturing(false);
    setCameraError('');
  };

  const retakePhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      setPhotoBefore('');
      setPhotoBeforeDate('');
      setPhotoBeforeTime('');
      setPhotoBeforeSource('');
    } else {
      setPhotoAfter('');
      setPhotoAfterDate('');
      setPhotoAfterTime('');
      setPhotoAfterSource('');
    }
    openCamera(type);
  };

  const reuploadPhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      setPhotoBefore('');
      setPhotoBeforeDate('');
      setPhotoBeforeTime('');
      setPhotoBeforeSource('');
    } else {
      setPhotoAfter('');
      setPhotoAfterDate('');
      setPhotoAfterTime('');
      setPhotoAfterSource('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    try {
      const processedImage = await cameraManager.current.processUploadedImage(file);

      if (processedImage) {
        // Get current time in GMT+7 (WIB)
        const { date, time } = getIndonesiaDateTime();

        if (type === 'before') {
          setPhotoBefore(processedImage);
          setPhotoBeforeDate(date);
          setPhotoBeforeTime(time);
          setPhotoBeforeSource('upload');
        } else {
          setPhotoAfter(processedImage);
          setPhotoAfterDate(date);
          setPhotoAfterTime(time);
          setPhotoAfterSource('upload');
        }
      } else {
        alert('Gagal memproses gambar. Coba lagi.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat upload gambar.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleSaveTemporary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[SAVE] Starting save process...');
    console.log('[SAVE] Form data:', {
      selectedPlant,
      line,
      area,
      bagian,
      tanggal,
      hasPhotoBefore: !!photoBefore,
      hasPhotoAfter: !!photoAfter,
      keteranganLength: keterangan.length
    });
    
    if (!selectedPlant || !line || !area || !bagian) {
      console.error('[SAVE] Missing required fields:', {
        selectedPlant: !!selectedPlant,
        line: !!line,
        area: !!area,
        bagian: !!bagian
      });
      alert('Plant, Line, Area, dan Bagian harus diisi');
      return;
    }

    try {
      console.log('[SAVE] Checking for existing record...');
      const metadata = recordsMetadata.find(r => r.area === area && r.bagian === bagian);
      const existingRecord = metadata ? { id: metadata.id } : null;
      console.log('[SAVE] Existing record found:', !!existingRecord);

      let photoBeforeWithTimestamp = photoBefore;
      let photoAfterWithTimestamp = photoAfter;

      const existingRecordData = existingRecord ? await getRecordById(existingRecord.id) : null;
      const photoBeforeChanged = !existingRecordData ||
        (existingRecordData.photoBeforeUri !== photoBefore && existingRecordData.foto_sebelum !== photoBefore);
      const photoAfterChanged = !existingRecordData ||
        (existingRecordData.photoAfterUri !== photoAfter && existingRecordData.foto_sesudah !== photoAfter);

      if (photoBefore && photoBeforeChanged && photoBeforeSource === 'camera') {
        photoBeforeWithTimestamp = await cameraManager.current.addTimestampToImage(
          photoBefore,
          undefined,
          undefined
        ) || photoBefore;
      } else if (photoBefore && photoBeforeChanged) {
        photoBeforeWithTimestamp = photoBefore;
      }

      if (photoAfter && photoAfterChanged && photoAfterSource === 'camera') {
        photoAfterWithTimestamp = await cameraManager.current.addTimestampToImage(
          photoAfter,
          undefined,
          undefined
        ) || photoAfter;
      } else if (photoAfter && photoAfterChanged) {
        photoAfterWithTimestamp = photoAfter;
      }

      if (existingRecord && existingRecord.id) {
        // Update existing record
        console.log('[SAVE] Updating existing record:', existingRecord.id);
        const beforeTimestamp = photoBeforeDate && photoBeforeTime
          ? new Date(`${photoBeforeDate}T${photoBeforeTime}:00`).toISOString()
          : '';
        const afterTimestamp = photoAfterDate && photoAfterTime
          ? new Date(`${photoAfterDate}T${photoAfterTime}:00`).toISOString()
          : '';

        await updateRecord(existingRecord.id, {
          photoBeforeUri: photoBeforeWithTimestamp,
          foto_sebelum_timestamp: beforeTimestamp,
          photoAfterUri: photoAfterWithTimestamp,
          foto_sesudah_timestamp: afterTimestamp,
          keterangan,
          status: 'draft'
        });
        console.log('[SAVE] Record updated successfully');
      } else {
        // Create new record
        console.log('[SAVE] Creating new record');
        const beforeTimestamp = photoBeforeDate && photoBeforeTime
          ? new Date(`${photoBeforeDate}T${photoBeforeTime}:00`).toISOString()
          : '';
        const afterTimestamp = photoAfterDate && photoAfterTime
          ? new Date(`${photoAfterDate}T${photoAfterTime}:00`).toISOString()
          : '';

        const record = {
          plant: selectedPlant,
          line,
          area,
          bagian,
          photoBeforeUri: photoBeforeWithTimestamp,
          foto_sebelum_timestamp: beforeTimestamp,
          photoAfterUri: photoAfterWithTimestamp,
          foto_sesudah_timestamp: afterTimestamp,
          keterangan,
          tanggal,
          status: 'draft' as const,
          createdAt: new Date().toISOString()
        };
        console.log('[SAVE] Record object prepared:', record);
        const recordId = await insertRecord(record);
        console.log('[SAVE] Record created successfully with ID:', recordId);
      }
      
      // Update selected line in context
      setSelectedLine(line);
      
      // Reload metadata
      console.log('[SAVE] Reloading metadata...');
      await loadMetadata();

      console.log('[SAVE] Save process completed successfully');
      alert('Record berhasil disimpan sementara');
      
      // Navigate to next bagian automatically
      navigateToBagian('next');
    } catch (error) {
      console.error('[SAVE] Save record error:', error);
      console.error('[SAVE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal menyimpan record: ${errorMessage}\n\nSilakan cek console untuk detail lebih lanjut.`);
    }
  };

  const handleSaveAll = async () => {
    console.log('[SAVE_ALL] Starting save all process...');

    const draftRecords = recordsMetadata.filter(r => r.status === 'draft');

    // Allow saving even if incomplete - just show warning
    const incompleteRecords = recordsMetadata.filter(r => !r.foto_sebelum_timestamp || !r.foto_sesudah_timestamp);

    if (incompleteRecords.length > 0) {
      const confirmSave = confirm(`Perhatian: Ada ${incompleteRecords.length} bagian dengan foto yang belum lengkap.\n\nTetap simpan semua data?`);
      if (!confirmSave) {
        return;
      }
    }

    if (draftRecords.length === 0) {
      alert('Tidak ada draft record untuk disimpan.');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const record of draftRecords) {
        if (record.id) {
          try {
            await updateRecord(record.id, { status: 'completed' });
            successCount++;
          } catch (error) {
            console.error('[SAVE_ALL] Failed to update record:', record.id, error);
            errorCount++;
          }
        }
      }

      if (errorCount > 0) {
        alert(`${successCount} record berhasil disimpan, ${errorCount} record gagal disimpan.`);
      } else {
        alert(`${successCount} record berhasil disimpan ke Sanitation Records`);
      }

      await loadMetadata();
    } catch (error) {
      console.error('[SAVE_ALL] Save all records error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal menyimpan semua record: ${errorMessage}`);
    }
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
          Foto {cameraType === 'before' ? 'Sebelum' : 'Setelah'} Sanitasi
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
    <div className="container">
      <button className="back-button" onClick={() => navigate('/records')}>
        <ArrowLeft size={24} />
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

      <div className="card">
        <div className="header">
          <h1 className="title">Create Record</h1>
          <p className="subtitle">{selectedPlant}</p>

          {/* Tanggal Input */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>

          {/* Grid Progress Indicator */}
          {line && (
            <div className="grid-progress-container">
              <div className="progress-summary">
                <span style={{ color: recordsMetadata.filter(r => r.foto_sebelum_timestamp && r.foto_sesudah_timestamp).length === getTotalBagianCount() ? '#10B981' : '#EF4444' }}>
                  Selesai: {recordsMetadata.filter(r => r.foto_sebelum_timestamp && r.foto_sesudah_timestamp).length}/{getTotalBagianCount()} bagian
                </span>
                {recordsMetadata.filter(r => r.status === 'draft').length > 0 && (
                  <span style={{ color: '#F59E0B', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Draft: {recordsMetadata.filter(r => r.status === 'draft').length} bagian
                  </span>
                )}
              </div>
              
              <div className="progress-grid">
                {Array.from({ length: getTotalBagianCount() }, (_, index) => {
                  const bagianNumber = (index + 1).toString();
                  const { completedSet, partialSet } = getCompletedBagianSet();
                  const isCompleted = completedSet.has(bagianNumber);
                  const isPartial = partialSet.has(bagianNumber);
                  const isCurrent = getCurrentBagianIndex() === index;
                  
                  return (
                    <div
                      key={bagianNumber}
                      className={`progress-box ${isCompleted ? 'completed' : ''} ${isPartial ? 'partial' : ''} ${isCurrent ? 'current' : ''} clickable`}
                      onClick={() => navigateToIndex(index)}
                    >
                      {bagianNumber}
                      {isCompleted && <span className="checkmark">✓</span>}
                      {isPartial && <span className="partial-icon">🕘</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveTemporary}>
          {/* Line Display (Read-only) */}
          {line && (
            <div className="form-group">
              <label className="label">Line</label>
              <div className="selected-line-readonly">
                <span>Line {line}</span>
              </div>
            </div>
          )}

          {line && (
            <>
              <div className="form-group">
                <label className="label">Area</label>
                <select
                  className="select"
                  value={area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  required
                >
                  <option value="">Pilih Area</option>
                  {getActiveAreas().map((areaItem) => (
                    <option key={areaItem} value={areaItem}>
                      {areaItem}
                    </option>
                  ))}
                </select>
              </div>

              {area && (
                <div className="form-group">
                  <label className="label">Bagian</label>
                  <select
                    className="select"
                    value={bagian}
                    onChange={(e) => handleBagianChange(e.target.value)}
                    required
                  >
                    <option value="">Pilih Bagian</option>
                    {getActiveBagianByArea()[area]?.map((bagianItem: any) => {
                      const bagianName = useDynamicData ? bagianItem.name : bagianItem;
                      return (
                        <option key={bagianName} value={bagianName}>
                          {bagianName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Navigation Buttons */}
              {area && bagian && (
                <div className="navigation-buttons">
                  <button 
                    type="button"
                    className="nav-button"
                    onClick={() => navigateToBagian('prev')}
                  >
                    <ChevronLeft size={16} />
                    Sebelumnya
                  </button>
                  
                  <div className="bagian-indicator">
                    {getCurrentBagianIndex() + 1}/{getTotalBagianCount()}
                  </div>
                  
                  <button 
                    type="button"
                    className="nav-button"
                    onClick={() => navigateToBagian('next')}
                  >
                    Selanjutnya
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <div className="photo-section">
                <label className="label">Foto Sebelum Sanitasi</label>
                <div className="photo-status">
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    Ambil foto kondisi sebelum sanitasi
                  </p>
                  <span className={`photo-indicator ${photoBefore ? 'taken' : 'not-taken'}`}>
                    {photoBefore ? '✓ Foto sudah diambil' : '○ Foto belum diambil'}
                  </span>
                </div>

                {photoBefore && (
                  <div style={{
                    padding: '1rem',
                    background: '#F3F4F6',
                    borderRadius: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {photoBeforeSource === 'camera' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', padding: '0.75rem', background: 'white', borderRadius: '0.375rem' }}>
                          📸 Foto dari kamera - Timestamp otomatis dari sistem
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="preview-button"
                        onClick={() => setPreviewImage(photoBefore)}
                        style={{ flex: 1 }}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        type="button"
                        className="retake-button"
                        onClick={() => retakePhoto('before')}
                        style={{ flex: 1 }}
                      >
                        <Camera size={16} />
                        Ambil Ulang
                      </button>
                      <button
                        type="button"
                        className="retake-button"
                        onClick={() => {
                          reuploadPhoto('before');
                          uploadBeforeRef.current?.click();
                        }}
                        style={{ flex: 1, background: '#3B82F6' }}
                      >
                        <Upload size={16} />
                        Upload Ulang
                      </button>
                    </div>
                  </div>
                )}

                {!photoBefore && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="photo-button"
                      onClick={() => openCamera('before')}
                      style={{ flex: 1 }}
                    >
                      <Camera size={20} />
                      Ambil Foto
                    </button>
                    <label
                      className="photo-button"
                      style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Upload size={20} />
                      Upload Foto
                      <input
                        ref={uploadBeforeRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'before')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="photo-section">
                <label className="label">Foto Setelah Sanitasi</label>
                <div className="photo-status">
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    Ambil foto kondisi setelah sanitasi
                  </p>
                  <span className={`photo-indicator ${photoAfter ? 'taken' : 'not-taken'}`}>
                    {photoAfter ? '✓ Foto sudah diambil' : '○ Foto belum diambil'}
                  </span>
                </div>

                {photoAfter && (
                  <div style={{
                    padding: '1rem',
                    background: '#F3F4F6',
                    borderRadius: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {photoAfterSource === 'camera' && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', padding: '0.75rem', background: 'white', borderRadius: '0.375rem' }}>
                          📸 Foto dari kamera - Timestamp otomatis dari sistem
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="preview-button"
                        onClick={() => setPreviewImage(photoAfter)}
                        style={{ flex: 1 }}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button
                        type="button"
                        className="retake-button"
                        onClick={() => retakePhoto('after')}
                        style={{ flex: 1 }}
                      >
                        <Camera size={16} />
                        Ambil Ulang
                      </button>
                      <button
                        type="button"
                        className="retake-button"
                        onClick={() => {
                          reuploadPhoto('after');
                          uploadAfterRef.current?.click();
                        }}
                        style={{ flex: 1, background: '#3B82F6' }}
                      >
                        <Upload size={16} />
                        Upload Ulang
                      </button>
                    </div>
                  </div>
                )}

                {!photoAfter && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="photo-button"
                      onClick={() => openCamera('after')}
                      style={{ flex: 1 }}
                    >
                      <Camera size={20} />
                      Ambil Foto
                    </button>
                    <label
                      className="photo-button"
                      style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Upload size={20} />
                      Upload Foto
                      <input
                        ref={uploadAfterRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'after')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Keterangan</label>
                <textarea
                  className="input textarea"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Masukkan keterangan"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="button button-secondary"
                disabled={!line || !area || !bagian}
              >
                Simpan Sementara
              </button>

              {/* Save All Button - Available for All Users */}
              <button
                type="button"
                className="button button-primary"
                onClick={handleSaveAll}
                style={{ marginTop: '1rem' }}
              >
                {recordsMetadata.filter(r => r.status === 'draft').length > 0
                  ? `Simpan Semua (${recordsMetadata.filter(r => r.status === 'draft').length} Draft)`
                  : 'Simpan Semua'}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            <X size={24} color="#374151" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '0.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { KlipingRecord } from '../types/database';
import { supabase } from './supabase';
import { requestQueue } from './requestQueue';

const fetchRecordPhotos = async (recordId: string): Promise<any> => {
  try {
    const result = await requestQueue.add(async () => {
      return await supabase
        .from('kliping_records')
        .select('Foto_Etiket, Foto_Mesin_1, Foto_Mesin_2, Foto_Mesin_3, Foto_Mesin_4, Foto_Mesin_5, Foto_Mesin_6, Foto_Mesin_7')
        .eq('id', recordId)
        .maybeSingle();
    });

    if (result.error) {
      console.error(`[EXPORT] Error fetching photos for record ${recordId}:`, result.error);
      return {};
    }

    return result.data || {};
  } catch (error) {
    console.error(`[EXPORT] Exception fetching photos for record ${recordId}:`, error);
    return {};
  }
};

const formatIndonesianDate = (dateString: string): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (timestamp: string | undefined): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}.${minutes}`;
};

const FOTO_TYPES = [
  { key: 'foto_etiket', label: 'ETIKET' },
  { key: 'foto_banded', label: 'BANDED' },
  { key: 'foto_karton', label: 'KARTON' },
  { key: 'foto_label_etiket', label: 'LABEL ETIKET' },
  { key: 'foto_label_bumbu', label: 'LABEL BUMBU' },
  { key: 'foto_label_minyak_bumbu', label: 'LABEL MINYAK BUMBU' },
  { key: 'foto_label_si', label: 'LABEL SI' },
  { key: 'foto_label_opp_banded', label: 'LABEL OPP BANDED' },
];

const base64ToBuffer = (base64: string): ArrayBuffer => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const resizeAndCompressImage = (base64: string, maxWidth: number = 500, maxHeight: number = 500, quality: number = 0.92): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64);
        return;
      }

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

// Image cache for better performance
const imageResizeCache = new Map<string, ArrayBuffer>();
const MAX_CACHE_SIZE = 50;

const addToCache = (key: string, value: ArrayBuffer) => {
  if (imageResizeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageResizeCache.keys().next().value;
    if (firstKey) {
      imageResizeCache.delete(firstKey);
    }
  }
  imageResizeCache.set(key, value);
};

// Generate unique hash for base64 string
const hashBase64 = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Batch process images for better performance
const processImagesInBatch = async (
  records: KlipingRecord[],
  fotoKey: string
): Promise<Map<number, ArrayBuffer>> => {
  const imageMap = new Map<number, ArrayBuffer>();
  const BATCH_SIZE = 5;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (record, batchIdx) => {
      const idx = i + batchIdx;
      const fotoBase64 = (record as any)[fotoKey];
      if (fotoBase64) {
        try {
          const cacheKey = `${hashBase64(fotoBase64)}_${fotoKey}`;
          if (imageResizeCache.has(cacheKey)) {
            imageMap.set(idx, imageResizeCache.get(cacheKey)!);
          } else {
            const compressed = await resizeAndCompressImage(fotoBase64, 500, 500, 0.90);
            const imageBuffer = base64ToBuffer(compressed);
            addToCache(cacheKey, imageBuffer);
            imageMap.set(idx, imageBuffer);
          }
        } catch (error) {
          console.error(`Error processing image for ${fotoKey}:`, error);
        }
      }
    });
    await Promise.all(promises);
  }

  return imageMap;
};

const sortMesinNumber = (mesin: string): number => {
  const match = mesin.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

export const exportKlipingToExcel = async (records: KlipingRecord[]): Promise<boolean> => {
  try {
    if (records.length === 0) return false;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kliping Records', {
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    const groupedByPengamatan: { [key: string]: KlipingRecord[] } = {};
    records.forEach(record => {
      const key = record.pengamatan_ke || '0';
      if (!groupedByPengamatan[key]) {
        groupedByPengamatan[key] = [];
      }
      groupedByPengamatan[key].push(record);
    });

    Object.keys(groupedByPengamatan).forEach(key => {
      groupedByPengamatan[key].sort((a, b) => {
        return sortMesinNumber(a.mesin || '') - sortMesinNumber(b.mesin || '');
      });
    });

    const sortedRecords: KlipingRecord[] = [];
    Object.keys(groupedByPengamatan)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(key => {
        sortedRecords.push(...groupedByPengamatan[key]);
      });

    const firstRecord = sortedRecords[0];
    const totalColumns = 1 + sortedRecords.length;

    worksheet.mergeCells(1, 1, 1, totalColumns);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'LAPORAN PENGAMATAN KESESUAIAN PENGEMAS DAN KODE PRODUKSI';
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    worksheet.getRow(2).height = 5;

    worksheet.getCell(3, 1).value = 'Tanggal';
    worksheet.getCell(3, 1).font = { bold: true };
    worksheet.getCell(3, 2).value = `: ${formatIndonesianDate(firstRecord.tanggal)}`;

    worksheet.getCell(4, 1).value = 'Line';
    worksheet.getCell(4, 1).font = { bold: true };
    worksheet.getCell(4, 2).value = `: ${firstRecord.line}`;

    worksheet.getCell(5, 1).value = 'Regu/Shift';
    worksheet.getCell(5, 1).font = { bold: true };
    worksheet.getCell(5, 2).value = `: ${firstRecord.regu}${firstRecord.shift}`;

    worksheet.getCell(6, 1).value = 'QC Proses';
    worksheet.getCell(6, 1).font = { bold: true };
    worksheet.getCell(6, 2).value = `: ${firstRecord.created_by || 'N/A'}`;

    worksheet.getRow(7).height = 5;

    const headerRow = 8;
    let colIndex = 2;

    worksheet.mergeCells(headerRow, 1, headerRow + 2, 1);
    const labelCell = worksheet.getCell(headerRow, 1);
    labelCell.value = 'PENGAMATAN';
    labelCell.font = { bold: true, size: 10 };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
    labelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    const sortedPengamatanKeys = Object.keys(groupedByPengamatan).sort((a, b) => parseInt(a) - parseInt(b));

    sortedPengamatanKeys.forEach(pengamatanKey => {
      const recordsForPengamatan = groupedByPengamatan[pengamatanKey];
      const mesinCount = recordsForPengamatan.length;
      const startCol = colIndex;
      const endCol = colIndex + mesinCount - 1;

      if (mesinCount > 1) {
        worksheet.mergeCells(headerRow, startCol, headerRow, endCol);
        worksheet.mergeCells(headerRow + 1, startCol, headerRow + 1, endCol);
      }

      const pengamatanCell = worksheet.getCell(headerRow, startCol);
      pengamatanCell.value = `PENGAMATAN ${pengamatanKey}`;
      pengamatanCell.font = { bold: true, size: 11 };
      pengamatanCell.alignment = { horizontal: 'center', vertical: 'middle' };
      pengamatanCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      pengamatanCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      const firstRecordOfPengamatan = recordsForPengamatan[0];
      const flavorCell = worksheet.getCell(headerRow + 1, startCol);
      flavorCell.value = `${firstRecordOfPengamatan.flavor} (${formatTime(firstRecordOfPengamatan.pengamatan_timestamp)})`;
      flavorCell.font = { bold: true, size: 10 };
      flavorCell.alignment = { horizontal: 'center', vertical: 'middle' };
      flavorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      flavorCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      recordsForPengamatan.forEach((record, idx) => {
        const mesinCell = worksheet.getCell(headerRow + 2, startCol + idx);
        mesinCell.value = record.mesin?.toUpperCase() || 'N/A';
        mesinCell.font = { bold: true, size: 9 };
        mesinCell.alignment = { horizontal: 'center', vertical: 'middle' };
        mesinCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE9D9' } };
        mesinCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' }
        };
      });

      colIndex += mesinCount;
    });

    let dataRow = headerRow + 3;

    console.log('[EXPORT] Fetching photos for records...');
    const recordsWithPhotos = await Promise.all(
      sortedRecords.map(async (record) => {
        const photos = await fetchRecordPhotos(record.id!);
        return { ...record, ...photos };
      })
    );
    console.log('[EXPORT] Photos fetched, processing images...');

    // Pre-process all images in batch for better performance
    const imageProcessingPromises = FOTO_TYPES.map(fotoType =>
      processImagesInBatch(recordsWithPhotos, fotoType.key)
    );
    const processedImages = await Promise.all(imageProcessingPromises);

    for (let fotoIdx = 0; fotoIdx < FOTO_TYPES.length; fotoIdx++) {
      const fotoType = FOTO_TYPES[fotoIdx];
      const imageMap = processedImages[fotoIdx];

      if (imageMap.size === 0) continue;

      const labelCell = worksheet.getCell(dataRow, 1);
      labelCell.value = fotoType.label;
      labelCell.font = { bold: true, size: 10 };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
      labelCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      colIndex = 2;
      recordsWithPhotos.forEach((_record, recordIdx) => {
        const cell = worksheet.getCell(dataRow, colIndex);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' }
        };

        const imageBuffer = imageMap.get(recordIdx);
        if (imageBuffer) {
          try {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'jpeg',
            });

            worksheet.addImage(imageId, {
              tl: { col: colIndex - 1, row: dataRow - 1 },
              ext: { width: 80, height: 80 },
              editAs: 'oneCell'
            });

            worksheet.getRow(dataRow).height = 65;
          } catch (error) {
            console.error(`Error adding image for ${fotoType.key}:`, error);
            cell.value = 'Error';
          }
        }

        colIndex++;
      });

      dataRow++;
    }

    worksheet.getColumn(1).width = 20;
    for (let col = 2; col <= totalColumns; col++) {
      worksheet.getColumn(col).width = 12;
    }

    const fileName = `Laporan_Kliping_${firstRecord.line}_Regu${firstRecord.regu}_Shift${firstRecord.shift}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

const generateExcelBuffer = async (records: KlipingRecord[]): Promise<ArrayBuffer> => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Tidak ada data untuk diekspor');
    }

    console.log(`[EXCEL] Generating buffer for ${records.length} records`);
    const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Kliping Records', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  const groupedByPengamatan: { [key: string]: KlipingRecord[] } = {};
  records.forEach(record => {
    const key = record.pengamatan_ke || '0';
    if (!groupedByPengamatan[key]) {
      groupedByPengamatan[key] = [];
    }
    groupedByPengamatan[key].push(record);
  });

  Object.keys(groupedByPengamatan).forEach(key => {
    groupedByPengamatan[key].sort((a, b) => {
      return sortMesinNumber(a.mesin || '') - sortMesinNumber(b.mesin || '');
    });
  });

  const sortedRecords: KlipingRecord[] = [];
  Object.keys(groupedByPengamatan)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
      sortedRecords.push(...groupedByPengamatan[key]);
    });

  const firstRecord = sortedRecords[0];
  const totalColumns = 1 + sortedRecords.length;

  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = 'LAPORAN PENGAMATAN KESESUAIAN PENGEMAS DAN KODE PRODUKSI';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  worksheet.getRow(2).height = 5;

  worksheet.getCell(3, 1).value = 'Tanggal';
  worksheet.getCell(3, 1).font = { bold: true };
  worksheet.getCell(3, 2).value = `: ${formatIndonesianDate(firstRecord.tanggal)}`;

  worksheet.getCell(4, 1).value = 'Line';
  worksheet.getCell(4, 1).font = { bold: true };
  worksheet.getCell(4, 2).value = `: ${firstRecord.line}`;

  worksheet.getCell(5, 1).value = 'Regu/Shift';
  worksheet.getCell(5, 1).font = { bold: true };
  worksheet.getCell(5, 2).value = `: ${firstRecord.regu}${firstRecord.shift}`;

  worksheet.getCell(6, 1).value = 'QC Proses';
  worksheet.getCell(6, 1).font = { bold: true };
  worksheet.getCell(6, 2).value = `: ${firstRecord.created_by || 'N/A'}`;

  worksheet.getRow(7).height = 5;

  const headerRow = 8;
  let colIndex = 2;

  worksheet.mergeCells(headerRow, 1, headerRow + 2, 1);
  const labelCell = worksheet.getCell(headerRow, 1);
  labelCell.value = 'PENGAMATAN';
  labelCell.font = { bold: true, size: 10 };
  labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
  labelCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' }
  };

  const sortedPengamatanKeys = Object.keys(groupedByPengamatan).sort((a, b) => parseInt(a) - parseInt(b));

  sortedPengamatanKeys.forEach(pengamatanKey => {
    const recordsForPengamatan = groupedByPengamatan[pengamatanKey];
    const mesinCount = recordsForPengamatan.length;
    const startCol = colIndex;
    const endCol = colIndex + mesinCount - 1;

    if (mesinCount > 1) {
      worksheet.mergeCells(headerRow, startCol, headerRow, endCol);
      worksheet.mergeCells(headerRow + 1, startCol, headerRow + 1, endCol);
    }

    const pengamatanCell = worksheet.getCell(headerRow, startCol);
    pengamatanCell.value = `PENGAMATAN ${pengamatanKey}`;
    pengamatanCell.font = { bold: true, size: 11 };
    pengamatanCell.alignment = { horizontal: 'center', vertical: 'middle' };
    pengamatanCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    pengamatanCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    const firstRecordOfPengamatan = recordsForPengamatan[0];
    const flavorCell = worksheet.getCell(headerRow + 1, startCol);
    flavorCell.value = `${firstRecordOfPengamatan.flavor} (${formatTime(firstRecordOfPengamatan.pengamatan_timestamp)})`;
    flavorCell.font = { bold: true, size: 10 };
    flavorCell.alignment = { horizontal: 'center', vertical: 'middle' };
    flavorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    flavorCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    recordsForPengamatan.forEach((record, idx) => {
      const mesinCell = worksheet.getCell(headerRow + 2, startCol + idx);
      mesinCell.value = record.mesin?.toUpperCase() || 'N/A';
      mesinCell.font = { bold: true, size: 9 };
      mesinCell.alignment = { horizontal: 'center', vertical: 'middle' };
      mesinCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE9D9' } };
      mesinCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    colIndex += mesinCount;
  });

  let dataRow = headerRow + 3;

  // Pre-process all images in batch for better performance
  const imageProcessingPromises2 = FOTO_TYPES.map(fotoType =>
    processImagesInBatch(sortedRecords, fotoType.key)
  );
  const processedImages2 = await Promise.all(imageProcessingPromises2);

  for (let fotoIdx = 0; fotoIdx < FOTO_TYPES.length; fotoIdx++) {
    const fotoType = FOTO_TYPES[fotoIdx];
    const imageMap = processedImages2[fotoIdx];

    if (imageMap.size === 0) continue;

    const labelCell = worksheet.getCell(dataRow, 1);
    labelCell.value = fotoType.label;
    labelCell.font = { bold: true, size: 10 };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
    labelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    colIndex = 2;
    sortedRecords.forEach((_record, recordIdx) => {
      const cell = worksheet.getCell(dataRow, colIndex);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      const imageBuffer = imageMap.get(recordIdx);
      if (imageBuffer) {
        try {
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'jpeg',
          });

          worksheet.addImage(imageId, {
            tl: { col: colIndex - 1, row: dataRow - 1 },
            ext: { width: 80, height: 80 },
            editAs: 'oneCell'
          });

          worksheet.getRow(dataRow).height = 65;
        } catch (error) {
          console.error(`Error adding image for ${fotoType.key}:`, error);
          cell.value = 'Error';
        }
      }

      colIndex++;
    });

    dataRow++;
  }

  worksheet.getColumn(1).width = 20;
  for (let col = 2; col <= totalColumns; col++) {
    worksheet.getColumn(col).width = 12;
  }

    console.log(`[EXCEL] Writing buffer...`);
    const buffer = await workbook.xlsx.writeBuffer();
    console.log(`[EXCEL] Buffer written successfully, size: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.error('[EXCEL] Error in generateExcelBuffer:', error);
    throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const exportKlipingToPDF = async (records: KlipingRecord[]): Promise<boolean> => {
  try {
    if (records.length === 0) return false;

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    const groupedByPengamatan: { [key: string]: KlipingRecord[] } = {};
    records.forEach(record => {
      const key = record.pengamatan_ke || '0';
      if (!groupedByPengamatan[key]) {
        groupedByPengamatan[key] = [];
      }
      groupedByPengamatan[key].push(record);
    });

    Object.keys(groupedByPengamatan).forEach(key => {
      groupedByPengamatan[key].sort((a, b) => {
        return sortMesinNumber(a.mesin || '') - sortMesinNumber(b.mesin || '');
      });
    });

    const sortedRecords: KlipingRecord[] = [];
    Object.keys(groupedByPengamatan)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(key => {
        sortedRecords.push(...groupedByPengamatan[key]);
      });

    const firstRecord = sortedRecords[0];

    let yPosition = margin + 5;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LAPORAN PENGAMATAN KESESUAIAN PENGEMAS DAN KODE PRODUKSI', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 12;

    const labelWidth = 30;
    const colonX = margin + labelWidth;
    const valueX = colonX + 5;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tanggal', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(':', colonX, yPosition);
    pdf.text(formatIndonesianDate(firstRecord.tanggal), valueX, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Line', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(':', colonX, yPosition);
    pdf.text(firstRecord.line, valueX, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Regu/Shift', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(':', colonX, yPosition);
    pdf.text(`${firstRecord.regu}${firstRecord.shift}`, valueX, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('QC Proses', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(':', colonX, yPosition);
    pdf.text(firstRecord.created_by || 'N/A', valueX, yPosition);
    yPosition += 10;

    console.log('[PDF EXPORT] Fetching photos for records...');
    const recordsWithPhotos = await Promise.all(
      sortedRecords.map(async (record) => {
        const photos = await fetchRecordPhotos(record.id!);
        return { ...record, ...photos };
      })
    );
    console.log('[PDF EXPORT] Photos fetched, generating PDF...');

    const labelColumnWidth = 45;
    const availableWidth = pageWidth - 2 * margin - labelColumnWidth;
    const cellWidth = availableWidth / recordsWithPhotos.length;

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(244, 176, 132);
    pdf.rect(margin, yPosition, labelColumnWidth, 18, 'FD');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text('PENGAMATAN', margin + labelColumnWidth / 2, yPosition + 9, { align: 'center' });

    let xPosition = margin + labelColumnWidth;

    const pengamatanGroups: { [key: string]: KlipingRecord[] } = {};
    recordsWithPhotos.forEach(record => {
      const key = record.pengamatan_ke || '0';
      if (!pengamatanGroups[key]) {
        pengamatanGroups[key] = [];
      }
      pengamatanGroups[key].push(record);
    });

    Object.keys(pengamatanGroups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(pengamatanKey => {
        const recordsInPengamatan = pengamatanGroups[pengamatanKey];
        const mesinCount = recordsInPengamatan.length;
        const groupWidth = cellWidth * mesinCount;

        pdf.setFillColor(217, 225, 242);
        pdf.rect(xPosition, yPosition, groupWidth, 6, 'FD');
        pdf.setTextColor(0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          `PENGAMATAN ${pengamatanKey}`,
          xPosition + groupWidth / 2,
          yPosition + 4,
          { align: 'center' }
        );

        const firstRecord = recordsInPengamatan[0];
        pdf.setFillColor(255, 255, 255);
        pdf.rect(xPosition, yPosition + 6, groupWidth, 6, 'FD');
        pdf.setFontSize(8);
        pdf.text(
          `${firstRecord.flavor} (${formatTime(firstRecord.pengamatan_timestamp)})`,
          xPosition + groupWidth / 2,
          yPosition + 10,
          { align: 'center' }
        );

        recordsInPengamatan.forEach((record, index) => {
          const mesinX = xPosition + (index * cellWidth);

          pdf.setFillColor(253, 233, 217);
          pdf.rect(mesinX, yPosition + 12, cellWidth, 6, 'FD');
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.text(
            record.mesin?.toUpperCase() || 'N/A',
            mesinX + cellWidth / 2,
            yPosition + 15.5,
            { align: 'center' }
          );
        });

        xPosition += groupWidth;
      });

    yPosition += 18;

    const fotoRowHeight = 38;
    const padding = 2;

    for (const fotoType of FOTO_TYPES) {
      let hasFoto = false;
      recordsWithPhotos.forEach(record => {
        if ((record as any)[fotoType.key]) {
          hasFoto = true;
        }
      });

      if (!hasFoto) continue;

      if (yPosition + fotoRowHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(244, 176, 132);
      pdf.rect(margin, yPosition, labelColumnWidth, fotoRowHeight, 'FD');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(fotoType.label, margin + labelColumnWidth / 2, yPosition + fotoRowHeight / 2, { align: 'center' });

      xPosition = margin + labelColumnWidth;

      const imagePromises = recordsWithPhotos.map(async (record) => {
        const fotoBase64 = (record as any)[fotoType.key];
        if (fotoBase64) {
          return await resizeAndCompressImage(fotoBase64, 400, 400);
        }
        return null;
      });
      const compressedImages = await Promise.all(imagePromises);

      recordsWithPhotos.forEach((_record, idx) => {
        const fotoBase64 = compressedImages[idx];

        pdf.setDrawColor(0);
        pdf.setLineWidth(0.3);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(xPosition, yPosition, cellWidth, fotoRowHeight, 'FD');

        if (fotoBase64) {
          try {
            const availableCellWidth = cellWidth - (padding * 2);
            const availableCellHeight = fotoRowHeight - (padding * 2);

            let imageWidth = availableCellHeight;
            let imageHeight = availableCellHeight;

            if (imageWidth > availableCellWidth) {
              imageWidth = availableCellWidth;
              imageHeight = availableCellWidth;
            }

            const imgX = xPosition + (cellWidth - imageWidth) / 2;
            const imgY = yPosition + (fotoRowHeight - imageHeight) / 2;
            pdf.addImage(fotoBase64, 'JPEG', imgX, imgY, imageWidth, imageHeight);
          } catch (error) {
            console.error(`Error adding image for ${fotoType.key}:`, error);
            pdf.setFontSize(6);
            pdf.setTextColor(0);
            pdf.text('Error', xPosition + cellWidth / 2, yPosition + fotoRowHeight / 2, { align: 'center' });
          }
        }

        xPosition += cellWidth;
      });

      yPosition += fotoRowHeight;
    }

    const fileName = `Laporan_Kliping_${firstRecord.line}_Regu${firstRecord.regu}_Shift${firstRecord.shift}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

interface GroupedRecords {
  [key: string]: KlipingRecord[];
}

const groupRecordsBySession = (records: KlipingRecord[]): GroupedRecords => {
  const grouped: GroupedRecords = {};

  records.forEach(record => {
    const key = `${record.line}_${record.regu}_${record.shift}_${record.tanggal}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });

  return grouped;
};

export const exportAllKlipingSequential = async (
  records: KlipingRecord[],
  format: 'excel' | 'pdf'
): Promise<boolean> => {
  try {
    if (records.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return false;
    }

    const grouped = groupRecordsBySession(records);
    const sessionKeys = Object.keys(grouped);

    if (sessionKeys.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return false;
    }

    console.log(`[EXPORT] Starting sequential export of ${sessionKeys.length} files...`);
    console.log(`[EXPORT] Session keys:`, sessionKeys);

    const confirmed = confirm(`Akan mendownload ${sessionKeys.length} file ${format.toUpperCase()} secara berurutan.\n\nBrowser mungkin akan meminta izin untuk multiple downloads.\nSilahkan klik "Allow" atau "Izinkan".\n\nLanjutkan?`);

    if (!confirmed) {
      console.log('[EXPORT] User cancelled export');
      return false;
    }

    let filesDownloaded = 0;
    const errors: string[] = [];

    for (let i = 0; i < sessionKeys.length; i++) {
      const key = sessionKeys[i];
      const sessionRecords = grouped[key];
      const firstRecord = sessionRecords[0];
      const fileName = `Laporan_Kliping_${firstRecord.line}_Regu${firstRecord.regu}_Shift${firstRecord.shift}_${firstRecord.tanggal}`;

      console.log(`[EXPORT] Processing ${i + 1}/${sessionKeys.length}: ${fileName}`);

      try {
        if (format === 'excel') {
          console.log(`[EXPORT] Generating Excel for ${fileName}...`);
          const buffer = await generateExcelBuffer(sessionRecords);
          console.log(`[EXPORT] Buffer size: ${buffer.byteLength} bytes`);

          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          console.log(`[EXPORT] Blob created, size: ${blob.size} bytes`);

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.xlsx`;
          link.style.display = 'none';
          document.body.appendChild(link);

          console.log(`[EXPORT] Triggering download for ${fileName}.xlsx`);
          link.click();

          await new Promise(resolve => setTimeout(resolve, 200));

          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          filesDownloaded++;
          console.log(`[EXPORT] Successfully downloaded ${fileName}.xlsx (${i + 1}/${sessionKeys.length})`);
        } else if (format === 'pdf') {
          console.log(`[EXPORT] Generating PDF for ${fileName}...`);
          const pdfBlob = await generatePDFBlob(sessionRecords);
          console.log(`[EXPORT] PDF blob created, size: ${pdfBlob.size} bytes`);

          const url = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);

          console.log(`[EXPORT] Triggering download for ${fileName}.pdf`);
          link.click();

          await new Promise(resolve => setTimeout(resolve, 200));

          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          filesDownloaded++;
          console.log(`[EXPORT] Successfully downloaded ${fileName}.pdf (${i + 1}/${sessionKeys.length})`);
        }

        imageResizeCache.clear();
        console.log(`[EXPORT] Cache cleared, processing next file...`);
      } catch (error) {
        const errorMsg = `${fileName}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[EXPORT] Error processing file ${i + 1}:`, error);
        console.error(`[EXPORT] Error details:`, {
          fileName,
          format,
          recordCount: sessionRecords.length,
          error: error
        });
        errors.push(errorMsg);

        alert(`Error saat memproses file ${i + 1}/${sessionKeys.length}:\n${errorMsg}\n\nMelanjutkan ke file berikutnya...`);
      }
    }

    if (filesDownloaded === 0) {
      const errorDetails = errors.length > 0 ? `\n\nDetail error:\n${errors.join('\n')}` : '';
      alert(`Gagal mendownload file.${errorDetails}`);
      return false;
    }

    if (errors.length > 0) {
      alert(`Download selesai!\n\n✅ ${filesDownloaded} file berhasil\n❌ ${errors.length} file gagal\n\nFile yang gagal:\n${errors.join('\n')}`);
    } else {
      alert(`✅ Download selesai! ${filesDownloaded} file berhasil terdownload.`);
    }

    return true;
  } catch (error) {
    console.error('[EXPORT] Fatal error:', error);
    alert(`Gagal mengekspor data: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

const generatePDFBlob = async (records: KlipingRecord[]): Promise<Blob> => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Tidak ada data untuk diekspor');
    }

    console.log(`[PDF] Generating blob for ${records.length} records`);
    const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const groupedByPengamatan: { [key: string]: KlipingRecord[] } = {};
  records.forEach(record => {
    const key = record.pengamatan_ke || '0';
    if (!groupedByPengamatan[key]) {
      groupedByPengamatan[key] = [];
    }
    groupedByPengamatan[key].push(record);
  });

  Object.keys(groupedByPengamatan).forEach(key => {
    groupedByPengamatan[key].sort((a, b) => {
      return sortMesinNumber(a.mesin || '') - sortMesinNumber(b.mesin || '');
    });
  });

  const sortedRecords: KlipingRecord[] = [];
  Object.keys(groupedByPengamatan)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
      sortedRecords.push(...groupedByPengamatan[key]);
    });

  const firstRecord = sortedRecords[0];

  let yPosition = margin + 5;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LAPORAN PENGAMATAN KESESUAIAN PENGEMAS DAN KODE PRODUKSI', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 12;

  const labelWidth = 30;
  const colonX = margin + labelWidth;
  const valueX = colonX + 5;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tanggal', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(':', colonX, yPosition);
  pdf.text(formatIndonesianDate(firstRecord.tanggal), valueX, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Line', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(':', colonX, yPosition);
  pdf.text(firstRecord.line, valueX, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Regu/Shift', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(':', colonX, yPosition);
  pdf.text(`${firstRecord.regu}${firstRecord.shift}`, valueX, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text('QC Proses', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(':', colonX, yPosition);
  pdf.text(firstRecord.created_by || 'N/A', valueX, yPosition);
  yPosition += 10;

  console.log('[PDF BLOB] Fetching photos for records...');
  const recordsWithPhotos = await Promise.all(
    sortedRecords.map(async (record) => {
      const photos = await fetchRecordPhotos(record.id!);
      return { ...record, ...photos };
    })
  );
  console.log('[PDF BLOB] Photos fetched, generating PDF...');

  const labelColumnWidth = 45;
  const availableWidth = pageWidth - 2 * margin - labelColumnWidth;
  const cellWidth = availableWidth / recordsWithPhotos.length;

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.setFillColor(244, 176, 132);
  pdf.rect(margin, yPosition, labelColumnWidth, 18, 'FD');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('PENGAMATAN', margin + labelColumnWidth / 2, yPosition + 9, { align: 'center' });

  let xPosition = margin + labelColumnWidth;

  const pengamatanGroups: { [key: string]: KlipingRecord[] } = {};
  recordsWithPhotos.forEach(record => {
    const key = record.pengamatan_ke || '0';
    if (!pengamatanGroups[key]) {
      pengamatanGroups[key] = [];
    }
    pengamatanGroups[key].push(record);
  });

  Object.keys(pengamatanGroups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(pengamatanKey => {
      const recordsInPengamatan = pengamatanGroups[pengamatanKey];
      const mesinCount = recordsInPengamatan.length;
      const groupWidth = cellWidth * mesinCount;

      pdf.setFillColor(217, 225, 242);
      pdf.rect(xPosition, yPosition, groupWidth, 6, 'FD');
      pdf.setTextColor(0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        `PENGAMATAN ${pengamatanKey}`,
        xPosition + groupWidth / 2,
        yPosition + 4,
        { align: 'center' }
      );

      const firstRecord = recordsInPengamatan[0];
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPosition, yPosition + 6, groupWidth, 6, 'FD');
      pdf.setFontSize(8);
      pdf.text(
        `${firstRecord.flavor} (${formatTime(firstRecord.pengamatan_timestamp)})`,
        xPosition + groupWidth / 2,
        yPosition + 10,
        { align: 'center' }
      );

      recordsInPengamatan.forEach((record, index) => {
        const mesinX = xPosition + (index * cellWidth);

        pdf.setFillColor(253, 233, 217);
        pdf.rect(mesinX, yPosition + 12, cellWidth, 6, 'FD');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          record.mesin?.toUpperCase() || 'N/A',
          mesinX + cellWidth / 2,
          yPosition + 15.5,
          { align: 'center' }
        );
      });

      xPosition += groupWidth;
    });

  yPosition += 18;

  const fotoRowHeight = 38;
  const padding = 2;

  for (const fotoType of FOTO_TYPES) {
    let hasFoto = false;
    recordsWithPhotos.forEach(record => {
      if ((record as any)[fotoType.key]) {
        hasFoto = true;
      }
    });

    if (!hasFoto) continue;

    if (yPosition + fotoRowHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(244, 176, 132);
    pdf.rect(margin, yPosition, labelColumnWidth, fotoRowHeight, 'FD');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(fotoType.label, margin + labelColumnWidth / 2, yPosition + fotoRowHeight / 2, { align: 'center' });

    xPosition = margin + labelColumnWidth;

    const imagePromises2 = recordsWithPhotos.map(async (record) => {
      const fotoBase64 = (record as any)[fotoType.key];
      if (fotoBase64) {
        return await resizeAndCompressImage(fotoBase64, 400, 400);
      }
      return null;
    });
    const compressedImages2 = await Promise.all(imagePromises2);

    recordsWithPhotos.forEach((_record, idx) => {
      const fotoBase64 = compressedImages2[idx];

      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPosition, yPosition, cellWidth, fotoRowHeight, 'FD');

      if (fotoBase64) {
        try {
          const availableCellWidth = cellWidth - (padding * 2);
          const availableCellHeight = fotoRowHeight - (padding * 2);

          let imageWidth = availableCellHeight;
          let imageHeight = availableCellHeight;

          if (imageWidth > availableCellWidth) {
            imageWidth = availableCellWidth;
            imageHeight = availableCellWidth;
          }

          const imgX = xPosition + (cellWidth - imageWidth) / 2;
          const imgY = yPosition + (fotoRowHeight - imageHeight) / 2;
          pdf.addImage(fotoBase64, 'JPEG', imgX, imgY, imageWidth, imageHeight);
        } catch (error) {
          console.error(`Error adding image for ${fotoType.key}:`, error);
          pdf.setFontSize(6);
          pdf.setTextColor(0);
          pdf.text('Error', xPosition + cellWidth / 2, yPosition + fotoRowHeight / 2, { align: 'center' });
        }
      }

      xPosition += cellWidth;
    });

    yPosition += fotoRowHeight;
  }

    console.log(`[PDF] Generating blob output...`);
    const blob = pdf.output('blob');
    console.log(`[PDF] Blob generated successfully, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error('[PDF] Error in generatePDFBlob:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

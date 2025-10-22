import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { SanitationRecord } from '../types/database';
import { getRecordById } from './database';
import { supabase } from './supabase';
import { getAreas, getBagianByAreaName } from './masterData';

// Convert base64 image to buffer for ExcelJS
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};

// Calculate week number from date (ISO 8601 - Monday as first day of week)
const getWeekInfo = (dateString: string): string => {
  const date = new Date(dateString);

  // Get the Monday of the week containing Jan 4th (ISO 8601 week 1)
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
  const jan4Monday = new Date(jan4);
  jan4Monday.setDate(jan4.getDate() - jan4Day + 1);

  // Get the Monday of the current week
  const currentDay = date.getDay() || 7; // Convert Sunday (0) to 7
  const currentMonday = new Date(date);
  currentMonday.setDate(date.getDate() - currentDay + 1);

  // Calculate week number
  const diffInMs = currentMonday.getTime() - jan4Monday.getTime();
  const weekNumber = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Format date as dd/mm/yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `Week ${weekNumber} (Tgl.${day}/${month}/${year})`;
};

// Format date to Indonesian format
const formatIndonesianDate = (dateString: string): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Get supervisor name for plant
const getSupervisorName = async (plant: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('supervisor_name')
      .eq('plant', plant)
      .single();

    if (error) {
      console.error('Error fetching supervisor:', error);
      return 'Unknown';
    }

    return data?.supervisor_name || 'Unknown';
  } catch (error) {
    console.error('Error in getSupervisorName:', error);
    return 'Unknown';
  }
};

// Get plant number from plant name (Plant-1 -> 1)
const getPlantNumber = (plant: string): string => {
  const match = plant.match(/Plant-(\d+)/);
  return match ? match[1] : '1';
};

// Sort areas by display_order from database
const sortAreasByDisplayOrder = async (areaNames: string[]): Promise<string[]> => {
  try {
    const areas = await getAreas();
    const areaOrderMap: { [name: string]: number } = {};

    areas.forEach(area => {
      areaOrderMap[area.name] = area.display_order;
    });

    return areaNames.sort((a, b) => {
      const orderA = areaOrderMap[a] ?? 999;
      const orderB = areaOrderMap[b] ?? 999;
      return orderA - orderB;
    });
  } catch (error) {
    console.error('Error sorting areas:', error);
    return areaNames.sort();
  }
};


// Resize image for better performance with caching
const imageCache = new Map<string, string>();

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

const resizeImage = (base64: string, targetWidth: number = 150, targetHeight: number = 150): Promise<string> => {
  return new Promise((resolve) => {
    const cacheKey = `${hashBase64(base64)}_${targetWidth}_${targetHeight}`;

    if (imageCache.has(cacheKey)) {
      resolve(imageCache.get(cacheKey)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64);
        return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const resized = canvas.toDataURL('image/jpeg', 0.85);
      imageCache.set(cacheKey, resized);
      resolve(resized);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

// Note: created_by in database already stores full_name string, not ID
// This function is kept for backward compatibility but not actively used


export const exportToExcel = async (records: SanitationRecord[]): Promise<boolean> => {
  try {
    if (records.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return false;
    }

    console.log('Loading full records with photos for export...');

    // Batch load records in parallel for better performance
    const recordPromises = records
      .filter(r => r.id)
      .map(record => getRecordById(record.id!));

    const loadedRecords = await Promise.all(recordPromises);

    const recordsWithPhotos: SanitationRecord[] = loadedRecords
      .filter(fullRecord =>
        fullRecord && fullRecord.photoBeforeUri && fullRecord.photoAfterUri
      ) as SanitationRecord[];

    if (recordsWithPhotos.length === 0) {
      alert('Tidak ada data dengan foto lengkap untuk diekspor');
      return false;
    }

    console.log('Loaded', recordsWithPhotos.length, 'records with complete photos');

    // Group records by date and plant
    const recordsByDate = recordsWithPhotos.reduce((acc, record) => {
      const key = `${record.tanggal}_${record.plant}`;
      if (!acc[key]) {
        acc[key] = {
          date: record.tanggal,
          plant: record.plant,
          records: []
        };
      }
      acc[key].records.push(record);
      return acc;
    }, {} as { [key: string]: { date: string; plant: string; records: SanitationRecord[] } });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sanitation App';
    workbook.created = new Date();
    
    for (const group of Object.values(recordsByDate)) {
      // Create worksheet
      const sheetName = `${group.plant}_${group.date}`.replace(/[^\w\s]/gi, '_').substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Set column widths exactly like reference
      worksheet.columns = [
        { header: 'No.', key: 'no', width: 6.4 },
        { header: 'Line', key: 'line', width: 7.4 },
        { header: 'Bagian', key: 'bagian', width: 16 },
        { header: 'Foto sebelum sanitasi', key: 'fotoBefore', width: 39.6 },
        { header: 'Foto setelah sanitasi', key: 'fotoAfter', width: 39.6 },
        { header: 'Keterangan', key: 'keterangan', width: 28.5 }
      ];

      // Row 1: Main header (A1:E1) and Code form (F1:F2)
      worksheet.mergeCells('A1:E2');
      const mainHeaderCell = worksheet.getCell('A1');
      mainHeaderCell.value = 'PT INDOFOOD CBP SUKSES MAKMUR Tbk\nNDHO - CENTRAL QUALITY ASSURANCE';
      mainHeaderCell.font = { bold: true, size: 12 };
      mainHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      mainHeaderCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Code form (F1:F2)
      worksheet.mergeCells('F1:F2');
      const codeCell = worksheet.getCell('F1');
      codeCell.value = 'Kode Form : CQA - 69\nNo.Terbitan : 1.0';
      codeCell.font = { size: 12 };
      codeCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
      codeCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };


      // Row 3: Title
      worksheet.mergeCells('A4:F4');
      const titleCell = worksheet.getCell('A4');
      titleCell.value = 'LAPORAN PELAKSANAAN SANITASI';
      titleCell.font = { bold: true, size: 12 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      // No border for title

      let currentRow = 6;

      // Group records by area
      const areaGroups = group.records.reduce((acc, record) => {
        if (!acc[record.area]) {
          acc[record.area] = [];
        }
        acc[record.area].push(record);
        return acc;
      }, {} as { [key: string]: SanitationRecord[] });

      let isFirstArea = true;
      const sortedAreas = await sortAreasByDisplayOrder(Object.keys(areaGroups));
      for (const area of sortedAreas) {
        let areaRecords = areaGroups[area];

        // Sort bagian within area by display_order
        try {
          const bagianList = await getBagianByAreaName(area);
          const bagianOrderMap: { [name: string]: number } = {};
          bagianList.forEach(b => {
            bagianOrderMap[b.name] = b.display_order;
          });

          areaRecords = areaRecords.sort((a, b) => {
            const orderA = bagianOrderMap[a.bagian] ?? 999;
            const orderB = bagianOrderMap[b.bagian] ?? 999;
            return orderA - orderB;
          });
        } catch (error) {
          console.error('Error sorting bagian:', error);
        }
        // Plant info (only for first area)
        if (isFirstArea) {
          worksheet.getCell(`A${currentRow}`).value = 'Pabrik';
          worksheet.getCell(`A${currentRow}`).font = { 
  size: 12,
};
          worksheet.getCell(`B${currentRow}`).value = `: ${group.plant}`;
          worksheet.getCell(`B${currentRow}`).font = { 
  size: 12,
  bold: true,
};
        }

        // Area info (red color like reference)
        worksheet.getCell(`A${currentRow + 1}`).value = 'Area';
        worksheet.getCell(`A${currentRow + 1}`).font = { 
  size: 12, 
};
        worksheet.getCell(`B${currentRow + 1}`).value = `: ${area}`;
        worksheet.getCell(`B${currentRow + 1}`).font = { 
  size: 12,
  bold: true,
  color: { argb: 'FF000000' } 
};
  

        // Week info (blue color, aligned with area row)
        const weekInfo = getWeekInfo(group.date);
        worksheet.getCell(`F${currentRow + 1}`).value = weekInfo;
        worksheet.getCell(`F${currentRow + 1}`).font = { 
  size: 12,
  bold: true,
  color: { argb: 'FF0000FF' } 
};
        worksheet.getCell(`F${currentRow + 1}`).alignment = { horizontal: 'right' };

        currentRow += 3;

        // Table headers
        const headerRow = worksheet.getRow(currentRow);
        headerRow.values = ['No.', 'Line', 'Bagian', 'Foto sebelum sanitasi', 'Foto setelah sanitasi', 'Keterangan'];
        headerRow.font = { bold: true, size: 12 };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        // Add borders to header
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;

        // Add data rows
        let rowNumber = 1;
        for (const record of areaRecords) {
          
          const dataRow = worksheet.getRow(currentRow);
          dataRow.values = [
            rowNumber,
            record.line, // Use actual line number from record
            record.bagian,
            '', // Will be filled with image
            '', // Will be filled with image
            null // placeholder, nanti kita isi manual supaya bisa styling
];

const keteranganCell = worksheet.getCell(`F${currentRow}`);
const richTextParts = [
  { text: record.keterangan, font: { color: { argb: 'FF000000' }, size: 12 } }
];

/*if (timestampBefore) {
  richTextParts.push({ text: `\n\nFoto sebelum dibuat: ${timestampBefore}`, font: { color: { argb: 'FF0000FF' }, size: 11 } });
}

if (timestampAfter) {
  richTextParts.push({ text: `\nFoto setelah dibuat: ${timestampAfter}`, font: { color: { argb: 'FF0000FF' }, size: 11 } });
}*/

keteranganCell.value = { richText: richTextParts };
keteranganCell.alignment = { wrapText: true, vertical: 'middle' };

          // Set row height to fit 293px images (approximately 219.80 points)
          dataRow.height = 219.8;

          // Add borders and alignment
          dataRow.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // All cells middle aligned with wrap text
            cell.alignment = { 
              horizontal: colNumber === 1 || colNumber === 2 ? 'center' : 'left', 
              vertical: 'middle', 
              wrapText: true 
            };
            
            // Set font size for all data cells
            cell.font = { size: 12 }; // Ubah angka ini untuk mengatur ukuran font
          });

          // Add images with 1:1 ratio and export 300px size
          try {
            if (record.photoBeforeUri) {
              const resizedBefore = await resizeImage(record.photoBeforeUri, 300, 300);
              const beforeBuffer = base64ToBuffer(resizedBefore);
              const beforeImageId = workbook.addImage({
                buffer: beforeBuffer,
                extension: 'jpeg',
              });
              
              worksheet.addImage(beforeImageId, {
               tl: { col: 3.22, row: currentRow - 0.96 },
                ext: { width: 265, height: 265 },
                editAs: 'oneCell'
              });
            }

            if (record.photoAfterUri) {
              const resizedAfter = await resizeImage(record.photoAfterUri, 300, 300);
              const afterBuffer = base64ToBuffer(resizedAfter);
              const afterImageId = workbook.addImage({
                buffer: afterBuffer,
                extension: 'jpeg',
              });
              
              worksheet.addImage(afterImageId, {
               tl: { col: 4.22, row: currentRow - 0.96 },
                ext: { width: 265, height: 265 },
                editAs: 'oneCell'
              });
            }
          } catch (error) {
            console.error('Error adding images:', error);
          }

          currentRow++;
          rowNumber++;
        }

        currentRow += 0; // 1 row space between areas
        isFirstArea = false;
      }

      // Add signature section at the end
      currentRow += 2; // Add some space

      // Get supervisor name and created by name
      const supervisorName = await getSupervisorName(group.plant);
      const plantNumber = getPlantNumber(group.plant);
      const createdByName = recordsWithPhotos[0]?.created_by || 'Anonymous';
      const formattedDate = formatIndonesianDate(group.date);

      // Date location row
      worksheet.getCell(`A${currentRow}`).value = `Cikarang Barat, ${formattedDate}`;
      worksheet.getCell(`A${currentRow}`).font = { size: 12 };
      currentRow += 2;

      // Headers: "Dibuat oleh," and "Mengetahui,"
      worksheet.getCell(`A${currentRow}`).value = 'Dibuat oleh,';
      worksheet.getCell(`A${currentRow}`).font = { size: 12 };
      worksheet.getCell(`E${currentRow}`).value = 'Mengetahui,';
      worksheet.getCell(`E${currentRow}`).font = { size: 12 };
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };
      currentRow += 4; // Space for signature

      // Names and positions
      worksheet.getCell(`A${currentRow}`).value = createdByName;
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true, underline: true };
      worksheet.getCell(`A${currentRow + 1}`).value = 'QC Proc. Field';
      worksheet.getCell(`A${currentRow + 1}`).font = { size: 12 };

      worksheet.getCell(`E${currentRow}`).value = supervisorName;
      worksheet.getCell(`E${currentRow}`).font = { size: 12, bold: true, underline: true };
      worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };
      worksheet.getCell(`E${currentRow + 1}`).value = `QC Proc. Spv ${plantNumber}`;
      worksheet.getCell(`E${currentRow + 1}`).font = { size: 12 };
      worksheet.getCell(`E${currentRow + 1}`).alignment = { horizontal: 'right' };
      currentRow += 3;

      // CC section
      worksheet.getCell(`A${currentRow}`).value = 'CC :';
      worksheet.getCell(`A${currentRow}`).font = { size: 12 };
      worksheet.getCell(`A${currentRow + 1}`).value = '- File';
      worksheet.getCell(`A${currentRow + 1}`).font = { size: 12 };
      worksheet.getCell(`A${currentRow + 2}`).value = '- BPDQCM';
      worksheet.getCell(`A${currentRow + 2}`).font = { size: 12 };
      worksheet.getCell(`A${currentRow + 3}`).value = `- PM ${plantNumber}`;
      worksheet.getCell(`A${currentRow + 3}`).font = { size: 12 };
      worksheet.getCell(`A${currentRow + 4}`).value = '- CQA';
      worksheet.getCell(`A${currentRow + 4}`).font = { size: 12 };
    }

    // Generate and download Excel file
// Ambil nama plant dan line dari record pertama
const firstRecord = recordsWithPhotos[0];
const plantSafe = (firstRecord?.plant || 'Unknown').replace(/[^\w-]/g, '');
const lineSafe = (firstRecord?.line ? `Line-${firstRecord.line}` : 'Line-Unknown').replace(/[^\w-]/g, '');
const dateStr = new Date().toISOString().split('T')[0];

// Generate nama file dengan plant dan line
const fileName = `Laporan_Sanitasi_${plantSafe}_${lineSafe}_${dateStr}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

export const exportToPDF = async (records: SanitationRecord[]): Promise<boolean> => {
  try {
    if (records.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return false;
    }

    console.log('Loading full records with photos for PDF export...');

    // Batch load records in parallel for better performance
    const recordPromises = records
      .filter(r => r.id)
      .map(record => getRecordById(record.id!));

    const loadedRecords = await Promise.all(recordPromises);

    const recordsWithPhotos: SanitationRecord[] = loadedRecords
      .filter(fullRecord =>
        fullRecord && fullRecord.photoBeforeUri && fullRecord.photoAfterUri
      ) as SanitationRecord[];

    if (recordsWithPhotos.length === 0) {
      alert('Tidak ada data dengan foto lengkap untuk diekspor');
      return false;
    }

    console.log('Loaded', recordsWithPhotos.length, 'records with complete photos for PDF');

    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Standard margin for A4 portrait

    // Group records by date and plant
    const recordsByDate = recordsWithPhotos.reduce((acc, record) => {
      const key = `${record.tanggal}_${record.plant}`;
      if (!acc[key]) {
        acc[key] = {
          date: record.tanggal,
          plant: record.plant,
          records: []
        };
      }
      acc[key].records.push(record);
      return acc;
    }, {} as { [key: string]: { date: string; plant: string; records: SanitationRecord[] } });

    let isFirstPage = true;

    for (const group of Object.values(recordsByDate)) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      let yPosition = margin;

      // Calculate available width for proper scaling
      const availableWidth = pageWidth - (2 * margin);
      
      // Draw main header border (merged cells like Excel)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, yPosition, availableWidth - 50, 15); // Main header area
      
      // Draw code form border (right side)
      pdf.rect(pageWidth - margin - 50, yPosition, 50, 15);

      // Main header (merged cells)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const headerCenterX = margin + (availableWidth - 50) / 2;
      pdf.text('PT INDOFOOD CBP SUKSES MAKMUR Tbk', headerCenterX, yPosition + 6, { align: 'center' });
      pdf.text('NDHO - CENTRAL QUALITY ASSURANCE', headerCenterX, yPosition + 11, { align: 'center' });
      
      // Code form (right side)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Kode Form : CQA - 69', pageWidth - margin - 48, yPosition + 6);
      pdf.text('No.Terbitan : 1.0', pageWidth - margin - 48, yPosition + 11);
      
      yPosition += 25;

      // Title (no border)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN PELAKSANAAN SANITASI', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;

      // Group by area
      const areaGroups = group.records.reduce((acc, record) => {
        if (!acc[record.area]) {
          acc[record.area] = [];
        }
        acc[record.area].push(record);
        return acc;
      }, {} as { [key: string]: SanitationRecord[] });

      let isFirstArea = true;
      const sortedAreasPDF = await sortAreasByDisplayOrder(Object.keys(areaGroups));
      for (const area of sortedAreasPDF) {
        let areaRecords = areaGroups[area];

        // Sort bagian within area by display_order
        try {
          const bagianList = await getBagianByAreaName(area);
          const bagianOrderMap: { [name: string]: number } = {};
          bagianList.forEach(b => {
            bagianOrderMap[b.name] = b.display_order;
          });

          areaRecords = areaRecords.sort((a, b) => {
            const orderA = bagianOrderMap[a.bagian] ?? 999;
            const orderB = bagianOrderMap[b.bagian] ?? 999;
            return orderA - orderB;
          });
        } catch (error) {
          console.error('Error sorting bagian:', error);
        }

        // Calculate space needed for Area + Week + Header + First Data Row
        const dataRowHeight = 50;
        const headerRowHeight = 12;
        const areaHeaderHeight = 15; // Plant/Area info + Week
        const minRequiredSpace = areaHeaderHeight + headerRowHeight + dataRowHeight + 10; // +10 for safety margin

        // Check if we have enough space for Area + Header + at least 1 data row
        // If not, start a new page
        // Use smaller bottom margin (30mm) to maximize space usage
        if (yPosition + minRequiredSpace > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin + 15;
        }

        // Plant info (only for first area)
        if (isFirstArea) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Pabrik : ${group.plant}`, margin, yPosition);
        }

        // Area info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Red color
        pdf.text(`Area : ${area}`, margin, yPosition + 5);

        // Week info (aligned with area)
        pdf.setTextColor(0, 0, 255); // Blue color
        const weekInfo = getWeekInfo(group.date);
        pdf.text(weekInfo, pageWidth - margin, yPosition + 5, { align: 'right' });
        pdf.setTextColor(0, 0, 0); // Reset to black

        yPosition += 15;

        // Table header - Scale to fit A4 portrait
        const colWidths = [15, 15, 20, 55, 55, 30]; // Adjusted to match reference layout (total: 210mm - 20mm margin = 190mm)

        // Draw header row
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        let xPos = margin;
        const headers = ['No.', 'Line', 'Bagian', 'Foto sebelum sanitasi', 'Foto setelah sanitasi', 'Keterangan'];

        headers.forEach((header, index) => {
          // Multi-line header text for better fit
          const headerLines = pdf.splitTextToSize(header, colWidths[index] - 4);
          pdf.text(headerLines, xPos + (colWidths[index] / 2), yPosition + 8, { align: 'center' });
          xPos += colWidths[index];
        });

        // Draw header borders
        xPos = margin;
        for (let i = 0; i <= colWidths.length; i++) {
          pdf.line(xPos, yPosition, xPos, yPosition + headerRowHeight);
          if (i < colWidths.length) xPos += colWidths[i];
        }
        pdf.line(margin, yPosition, margin + colWidths.reduce((a, b) => a + b, 0), yPosition);
        pdf.line(margin, yPosition + headerRowHeight, margin + colWidths.reduce((a, b) => a + b, 0), yPosition + headerRowHeight);

        yPosition += headerRowHeight;

        // Add data rows
        let rowNumber = 1;
        for (const record of areaRecords) {
          const dataRowHeight = 50; // Increased height for better image display

          // Check if we need a new page (but NOT for the first row, already checked above)
          // Use smaller margin (30mm) to maximize space usage on each page
          if (rowNumber > 1 && yPosition + dataRowHeight > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin + 15;
          }
          
          // Draw data row background
          pdf.setFillColor(255, 255, 255);
          pdf.rect(margin, yPosition, colWidths.reduce((a, b) => a + b, 0), dataRowHeight, 'F');
          
          // Add text data
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          
          xPos = margin;
          // No.
          pdf.text(rowNumber.toString(), xPos + (colWidths[0] / 2), yPosition + 8, { align: 'center' });
          xPos += colWidths[0];
          
          // Line - use actual line number
          pdf.text(record.line.toString(), xPos + (colWidths[1] / 2), yPosition + 8, { align: 'center' });
          xPos += colWidths[1];
          
          // Bagian
          const bagianLines = pdf.splitTextToSize(record.bagian, colWidths[2] - 4);
          pdf.text(bagianLines, xPos + 2, yPosition + 8);
          xPos += colWidths[2];
          
          // Add high-quality images
          try {
            if (record.photoBeforeUri) {
              const resizedBefore = await resizeImage(record.photoBeforeUri, 300, 300); // Higher resolution
              const imageWidth = 50;  // atur sesuai kebutuhan
              const imageHeight = 45; // atur sesuai kebutuhan
              const imageX = xPos + (colWidths[3] - imageWidth) / 2; // Center horizontally
              const imageY = yPosition + (dataRowHeight - imageHeight) / 2; // Center vertically
              pdf.addImage(resizedBefore, 'JPEG', imageX, imageY, imageWidth, imageHeight);
            }
            xPos += colWidths[3];

            if (record.photoAfterUri) {
              const resizedAfter = await resizeImage(record.photoAfterUri, 300, 300); // Higher resolution
              const imageWidth = 50;  // atur sesuai kebutuhan
              const imageHeight = 45; // atur sesuai kebutuhan
              const imageX = xPos + (colWidths[4] - imageWidth) / 2; // Center horizontally
              const imageY = yPosition + (dataRowHeight - imageHeight) / 2; // Center vertically
              pdf.addImage(resizedAfter, 'JPEG', imageX, imageY, imageWidth, imageHeight);
            }
            xPos += colWidths[4];
          } catch (error) {
            console.error('Error adding images to PDF:', error);
            xPos += colWidths[4];
          }
          
          // Keterangan
          pdf.setFontSize(6);
          const keteranganLines = pdf.splitTextToSize(record.keterangan, colWidths[5] - 4);
          pdf.text(keteranganLines, xPos + 2, yPosition + 8);
          pdf.setFontSize(8);

          // Add timestamp info if available
          /*let timestampYPos = yPosition + dataRowHeight - 15;

          if (record.foto_sebelum_timestamp) {
            const timestampBefore = new Date(record.foto_sebelum_timestamp).toLocaleString('id-ID');
            const beforeText = `Foto sebelum dibuat: ${timestampBefore}`;
            const beforeLines = pdf.splitTextToSize(beforeText, colWidths[5] - 4);

            pdf.setFontSize(7);
            pdf.setTextColor(0, 0, 255);
            pdf.text(beforeLines, xPos + 2, timestampYPos);
            timestampYPos += beforeLines.length * 3;
          }

          if (record.foto_sesudah_timestamp) {
            const timestampAfter = new Date(record.foto_sesudah_timestamp).toLocaleString('id-ID');
            const afterText = `Foto setelah dibuat: ${timestampAfter}`;
            const afterLines = pdf.splitTextToSize(afterText, colWidths[5] - 4);

            pdf.setFontSize(7);
            pdf.setTextColor(0, 0, 255);
            pdf.text(afterLines, xPos + 2, timestampYPos);
          }*/

          pdf.setTextColor(0, 0, 0);
          
          // Draw row borders
          xPos = margin;
          for (let i = 0; i <= colWidths.length; i++) {
            pdf.line(xPos, yPosition, xPos, yPosition + dataRowHeight);
            if (i < colWidths.length) xPos += colWidths[i];
          }
          pdf.line(margin, yPosition, margin + colWidths.reduce((a, b) => a + b, 0), yPosition);
          pdf.line(margin, yPosition + dataRowHeight, margin + colWidths.reduce((a, b) => a + b, 0), yPosition + dataRowHeight);
          
          yPosition += dataRowHeight;
          rowNumber++;
        }

        yPosition += 10; // Space between areas
        isFirstArea = false;
      }

      // Add signature section at the end
      yPosition += 10; // Add some space

      // Get supervisor name and created by name
      const supervisorName = await getSupervisorName(group.plant);
      const plantNumber = getPlantNumber(group.plant);
      const createdByName = recordsWithPhotos[0]?.created_by || 'Anonymous';
      const formattedDate = formatIndonesianDate(group.date);

      // Check if we need a new page for signature (needs ~60mm space)
      if (yPosition + 60 > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin + 15;
      }

      // Date location
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Cikarang Barat, ${formattedDate}`, margin, yPosition);
      yPosition += 10;

      // Headers: "Dibuat oleh," and "Mengetahui,"
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Dibuat oleh,', margin, yPosition);
      pdf.text('Mengetahui,', pageWidth - margin - 50, yPosition);
      yPosition += 20; // Space for signature

      // Names and positions
      pdf.setFont('helvetica', 'bold');
      pdf.text(createdByName, margin, yPosition);
      pdf.text(supervisorName, pageWidth - margin - 50, yPosition);
      yPosition += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text('QC Proc. Field', margin, yPosition);
      pdf.text(`QC Proc. Spv ${plantNumber}`, pageWidth - margin - 50, yPosition);
      yPosition += 10;

      // CC section
      pdf.setFont('helvetica', 'normal');
      pdf.text('CC :', margin, yPosition);
      yPosition += 5;
      pdf.text('- File', margin, yPosition);
      yPosition += 5;
      pdf.text('- BPDQCM', margin, yPosition);
      yPosition += 5;
      pdf.text(`- PM ${plantNumber}`, margin, yPosition);
      yPosition += 5;
      pdf.text('- CQA', margin, yPosition);
    }

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      pdf.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10);
    }

    // Ambil nama plant dan line dari record pertama
const firstRecord = recordsWithPhotos[0];
const plantSafe = (firstRecord?.plant || 'Unknown').replace(/[^\w-]/g, '');
const lineSafe = (firstRecord?.line ? `Line-${firstRecord.line}` : 'Line-Unknown').replace(/[^\w-]/g, '');
const dateStr = new Date().toISOString().split('T')[0];

// Generate nama file dengan plant dan line
const fileName = `Laporan_Sanitasi_${plantSafe}_${lineSafe}_${dateStr}.pdf`;
pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    return false;
  }
};
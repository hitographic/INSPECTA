import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { KlipingRecord } from '../types/database';

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
      const key = record.Pengamatan_ke || '0';
      if (!groupedByPengamatan[key]) {
        groupedByPengamatan[key] = [];
      }
      groupedByPengamatan[key].push(record);
    });

    Object.keys(groupedByPengamatan).forEach(key => {
      groupedByPengamatan[key].sort((a, b) => {
        return sortMesinNumber(a.Mesin || '') - sortMesinNumber(b.Mesin || '');
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
      flavorCell.value = `${firstRecordOfPengamatan.Flavor} (${formatTime(firstRecordOfPengamatan.pengamatan_timestamp)})`;
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
        mesinCell.value = record.Mesin?.toUpperCase() || 'N/A';
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

    for (const fotoType of FOTO_TYPES) {
      let hasFoto = false;
      sortedRecords.forEach(record => {
        if ((record as any)[fotoType.key]) {
          hasFoto = true;
        }
      });

      if (!hasFoto) continue;

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
      sortedRecords.forEach((record) => {
        const fotoBase64 = (record as any)[fotoType.key];
        const cell = worksheet.getCell(dataRow, colIndex);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' }
        };

        if (fotoBase64) {
          try {
            const imageBuffer = base64ToBuffer(fotoBase64);
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
    const key = record.Pengamatan_ke || '0';
    if (!groupedByPengamatan[key]) {
      groupedByPengamatan[key] = [];
    }
    groupedByPengamatan[key].push(record);
  });

  Object.keys(groupedByPengamatan).forEach(key => {
    groupedByPengamatan[key].sort((a, b) => {
      return sortMesinNumber(a.Mesin || '') - sortMesinNumber(b.Mesin || '');
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
    flavorCell.value = `${firstRecordOfPengamatan.Flavor} (${formatTime(firstRecordOfPengamatan.pengamatan_timestamp)})`;
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
      mesinCell.value = record.Mesin?.toUpperCase() || 'N/A';
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

  for (const fotoType of FOTO_TYPES) {
    let hasFoto = false;
    sortedRecords.forEach(record => {
      if ((record as any)[fotoType.key]) {
        hasFoto = true;
      }
    });

    if (!hasFoto) continue;

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
    sortedRecords.forEach((record) => {
      const fotoBase64 = (record as any)[fotoType.key];
      const cell = worksheet.getCell(dataRow, colIndex);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      if (fotoBase64) {
        try {
          const imageBuffer = base64ToBuffer(fotoBase64);
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

  return await workbook.xlsx.writeBuffer();
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
      const key = record.Pengamatan_ke || '0';
      if (!groupedByPengamatan[key]) {
        groupedByPengamatan[key] = [];
      }
      groupedByPengamatan[key].push(record);
    });

    Object.keys(groupedByPengamatan).forEach(key => {
      groupedByPengamatan[key].sort((a, b) => {
        return sortMesinNumber(a.Mesin || '') - sortMesinNumber(b.Mesin || '');
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

    const labelColumnWidth = 45;
    const availableWidth = pageWidth - 2 * margin - labelColumnWidth;
    const cellWidth = availableWidth / sortedRecords.length;

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
    sortedRecords.forEach(record => {
      const key = record.Pengamatan_ke || '0';
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
          `${firstRecord.Flavor} (${formatTime(firstRecord.pengamatan_timestamp)})`,
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
            record.Mesin?.toUpperCase() || 'N/A',
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
      sortedRecords.forEach(record => {
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

      sortedRecords.forEach((record) => {
        const fotoBase64 = (record as any)[fotoType.key];

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

export const exportAllKlipingToZip = async (
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

    const zip = new JSZip();
    let filesAdded = 0;

    for (const key of sessionKeys) {
      const sessionRecords = grouped[key];
      const firstRecord = sessionRecords[0];
      const fileName = `Laporan_Kliping_${firstRecord.line}_Regu${firstRecord.regu}_Shift${firstRecord.shift}_${firstRecord.tanggal}`;

      try {
        if (format === 'excel') {
          const buffer = await generateExcelBuffer(sessionRecords);
          zip.file(`${fileName}.xlsx`, buffer);
          filesAdded++;
        } else if (format === 'pdf') {
          const pdfBlob = await generatePDFBlob(sessionRecords);
          zip.file(`${fileName}.pdf`, pdfBlob);
          filesAdded++;
        }
      } catch (error) {
        console.error(`Error generating ${format} for ${key}:`, error);
      }
    }

    if (filesAdded === 0) {
      alert('Gagal membuat file untuk diekspor');
      return false;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kliping_Records_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting to ZIP:', error);
    alert('Gagal mengekspor data ke ZIP');
    return false;
  }
};

const generatePDFBlob = async (records: KlipingRecord[]): Promise<Blob> => {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const groupedByPengamatan: { [key: string]: KlipingRecord[] } = {};
  records.forEach(record => {
    const key = record.Pengamatan_ke || '0';
    if (!groupedByPengamatan[key]) {
      groupedByPengamatan[key] = [];
    }
    groupedByPengamatan[key].push(record);
  });

  Object.keys(groupedByPengamatan).forEach(key => {
    groupedByPengamatan[key].sort((a, b) => {
      return sortMesinNumber(a.Mesin || '') - sortMesinNumber(b.Mesin || '');
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

  const labelColumnWidth = 45;
  const availableWidth = pageWidth - 2 * margin - labelColumnWidth;
  const cellWidth = availableWidth / sortedRecords.length;

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
  sortedRecords.forEach(record => {
    const key = record.Pengamatan_ke || '0';
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
        `${firstRecord.Flavor} (${formatTime(firstRecord.pengamatan_timestamp)})`,
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
          record.Mesin?.toUpperCase() || 'N/A',
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
    sortedRecords.forEach(record => {
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

    sortedRecords.forEach((record) => {
      const fotoBase64 = (record as any)[fotoType.key];

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

  return pdf.output('blob');
};

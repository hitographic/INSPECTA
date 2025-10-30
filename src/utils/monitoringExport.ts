import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { MonitoringRecord } from './monitoringDatabase';
import { cropImageToSquare, cropImageToSquareForExcel } from './imageUtils';
import { sortAreasByDisplayOrder } from './masterData';

export const exportMonitoringToExcel = async (
  records: MonitoringRecord[],
  _plant: string,
  line: string,
  regu: string,
  shift: string
): Promise<void> => {
  if (records.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monitoring Data');

    const tanggalInput = records[0]?.tanggal
      ? new Date(records[0].tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const createdBy = records[0]?.created_by || '';

    let currentRow = 1;

    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'LAPORAN PENGAMATAN MONITORING AREA';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    const headerInfo = [
      ['Tanggal', tanggalInput],
      ['Line', line],
      ['Regu/Shift', `${regu}${shift}`],
      ['QC Proses', createdBy]
    ];

    headerInfo.forEach(([label, value]) => {
      worksheet.getCell(`A${currentRow}`).value = label;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = `: ${value}`;
      currentRow++;
    });

    currentRow += 1;

    const areaGroups: { [area: string]: MonitoringRecord[] } = {};
    records.forEach(record => {
      if (!areaGroups[record.area]) {
        areaGroups[record.area] = [];
      }
      areaGroups[record.area].push(record);
    });

    const areaNames = Object.keys(areaGroups);
    const sortedAreaNames = await sortAreasByDisplayOrder(areaNames);

    for (const area of sortedAreaNames) {
      const areaRecords = areaGroups[area];
      worksheet.getCell(`A${currentRow}`).value = 'Area';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = `: ${area}`;
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow += 1;

      worksheet.getCell(`A${currentRow}`).value = 'No';
      worksheet.getCell(`B${currentRow}`).value = 'Foto';
      worksheet.getCell(`C${currentRow}`).value = 'Keterangan';

      const headerRow = worksheet.getRow(currentRow);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      ['A', 'B', 'C'].forEach(col => {
        worksheet.getCell(`${col}${currentRow}`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRow++;

      areaRecords.sort((a, b) => a.data_number - b.data_number);

      for (const record of areaRecords) {
        worksheet.getCell(`A${currentRow}`).value = record.data_number;
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

        if (record.foto_url) {
          try {
            const imageBuffer = await cropImageToSquareForExcel(record.foto_url);
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'jpeg',
            });

            worksheet.addImage(imageId, {
              tl: { col: 1, row: currentRow - 1 },
              ext: { width: 120, height: 120 }
            });
          } catch (error) {
            console.error('Error adding image to Excel:', error);
            worksheet.getCell(`B${currentRow}`).value = 'Foto tidak tersedia';
            worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
          }
        } else {
          worksheet.getCell(`B${currentRow}`).value = 'Tidak ada foto';
          worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
        }

        worksheet.getCell(`C${currentRow}`).value = record.keterangan || '';
        worksheet.getCell(`C${currentRow}`).alignment = { vertical: 'middle', wrapText: true };

        ['A', 'B', 'C'].forEach(col => {
          worksheet.getCell(`${col}${currentRow}`).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        worksheet.getRow(currentRow).height = 90;
        currentRow++;
      }

      currentRow += 2;
    }

    worksheet.getColumn('A').width = 8;
    worksheet.getColumn('B').width = 20;
    worksheet.getColumn('C').width = 50;
    worksheet.getColumn('D').width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Monitoring_${line}_Regu${regu}_Shift${shift}_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    alert('Excel berhasil diekspor');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Gagal mengekspor ke Excel');
  }
};

export const exportMonitoringToPDF = async (
  records: MonitoringRecord[],
  _plant: string,
  line: string,
  regu: string,
  shift: string
): Promise<void> => {
  if (records.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'pdf-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    color: white;
    font-size: 20px;
    font-weight: bold;
  `;
  loadingDiv.innerHTML = 'Generating PDF...<br><small style="font-size: 14px; font-weight: normal;">Please wait...</small>';
  document.body.appendChild(loadingDiv);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    const tanggalInput = records[0]?.tanggal
      ? new Date(records[0].tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const createdBy = records[0]?.created_by || '';

    const addHeader = () => {
      yPosition = margin;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN PENGAMATAN MONITORING AREA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tanggal', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`: ${tanggalInput}`, margin + 25, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Line', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`: ${line}`, margin + 25, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Regu/Shift', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`: ${regu}${shift}`, margin + 25, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.text('QC Proses', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`: ${createdBy}`, margin + 25, yPosition);
      yPosition += 10;
    };

    addHeader();

    const areaGroups: { [area: string]: MonitoringRecord[] } = {};
    records.forEach(record => {
      if (!areaGroups[record.area]) {
        areaGroups[record.area] = [];
      }
      areaGroups[record.area].push(record);
    });

    const areaNames2 = Object.keys(areaGroups);
    const areas = await sortAreasByDisplayOrder(areaNames2);

    for (let areaIndex = 0; areaIndex < areas.length; areaIndex++) {
      const area = areas[areaIndex];
      const areaRecords = areaGroups[area];

      if (areaIndex > 0) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Area', margin, yPosition);
      pdf.text(`: ${area}`, margin + 25, yPosition);
      yPosition += 8;

      const tableStartX = margin;
      const tableWidth = pageWidth - 2 * margin;
      const colWidths = {
        no: 15,
        foto: 60,
        keterangan: tableWidth - 75
      };

      pdf.setFillColor(200, 200, 200);
      pdf.rect(tableStartX, yPosition, tableWidth, 8, 'F');

      pdf.setDrawColor(0);
      pdf.rect(tableStartX, yPosition, tableWidth, 8);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('No', tableStartX + colWidths.no / 2, yPosition + 5, { align: 'center' });
      pdf.text('Foto', tableStartX + colWidths.no + colWidths.foto / 2, yPosition + 5, { align: 'center' });
      pdf.text('Keterangan', tableStartX + colWidths.no + colWidths.foto + 5, yPosition + 5);

      pdf.line(tableStartX + colWidths.no, yPosition, tableStartX + colWidths.no, yPosition + 8);
      pdf.line(tableStartX + colWidths.no + colWidths.foto, yPosition, tableStartX + colWidths.no + colWidths.foto, yPosition + 8);

      yPosition += 8;

      areaRecords.sort((a, b) => a.data_number - b.data_number);

      for (const record of areaRecords) {
        const imageHeight = record.foto_url ? 45 : 20;
        let keteranganHeight = 20;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const keteranganLines = pdf.splitTextToSize(
          record.keterangan || '',
          colWidths.keterangan - 10
        );
        keteranganHeight = Math.max(20, keteranganLines.length * 5 + 10);

        const rowHeight = Math.max(imageHeight + 5, keteranganHeight);

        if (yPosition + rowHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Area', margin, yPosition);
          pdf.text(`: ${area} (lanjutan)`, margin + 25, yPosition);
          yPosition += 8;

          pdf.setFillColor(200, 200, 200);
          pdf.rect(tableStartX, yPosition, tableWidth, 8, 'F');
          pdf.setDrawColor(0);
          pdf.rect(tableStartX, yPosition, tableWidth, 8);

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('No', tableStartX + colWidths.no / 2, yPosition + 5, { align: 'center' });
          pdf.text('Foto', tableStartX + colWidths.no + colWidths.foto / 2, yPosition + 5, { align: 'center' });
          pdf.text('Keterangan', tableStartX + colWidths.no + colWidths.foto + 5, yPosition + 5);

          pdf.line(tableStartX + colWidths.no, yPosition, tableStartX + colWidths.no, yPosition + 8);
          pdf.line(tableStartX + colWidths.no + colWidths.foto, yPosition, tableStartX + colWidths.no + colWidths.foto, yPosition + 8);

          yPosition += 8;
        }

        pdf.rect(tableStartX, yPosition, tableWidth, rowHeight);
        pdf.line(tableStartX + colWidths.no, yPosition, tableStartX + colWidths.no, yPosition + rowHeight);
        pdf.line(tableStartX + colWidths.no + colWidths.foto, yPosition, tableStartX + colWidths.no + colWidths.foto, yPosition + rowHeight);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(record.data_number.toString(), tableStartX + colWidths.no / 2, yPosition + rowHeight / 2, { align: 'center', baseline: 'middle' });

        if (record.foto_url) {
          try {
            const croppedImage = await cropImageToSquare(record.foto_url);
            const imgSize = 40;
            const imgX = tableStartX + colWidths.no + (colWidths.foto - imgSize) / 2;
            const imgY = yPosition + (rowHeight - imgSize) / 2;
            pdf.addImage(croppedImage, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch (error) {
            console.error('Error adding image:', error);
            pdf.setFontSize(8);
            pdf.text('Foto tidak tersedia', tableStartX + colWidths.no + colWidths.foto / 2, yPosition + rowHeight / 2, { align: 'center', baseline: 'middle' });
          }
        }

        pdf.setFontSize(10);
        let keteranganY = yPosition + 5;
        keteranganLines.forEach((line: string) => {
          pdf.text(line, tableStartX + colWidths.no + colWidths.foto + 5, keteranganY);
          keteranganY += 5;
        });

        yPosition += rowHeight;
      }
    }

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(
        `Halaman ${i} dari ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    pdf.save(`Laporan_Monitoring_${line}_Regu${regu}_Shift${shift}_${new Date().getTime()}.pdf`);

    const loading = document.getElementById('pdf-loading');
    if (loading) {
      document.body.removeChild(loading);
    }

    alert('PDF berhasil diekspor');
  } catch (error) {
    console.error('Error exporting to PDF:', error);

    const loading = document.getElementById('pdf-loading');
    if (loading) {
      document.body.removeChild(loading);
    }

    alert('Gagal mengekspor ke PDF');
  }
};

export const exportAllMonitoringToExcel = async (
  records: MonitoringRecord[],
  plant: string
): Promise<void> => {
  if (records.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Monitoring Data');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Plant', key: 'plant', width: 12 },
      { header: 'Line', key: 'line', width: 12 },
      { header: 'Regu', key: 'regu', width: 10 },
      { header: 'Shift', key: 'shift', width: 10 },
      { header: 'Area', key: 'area', width: 20 },
      { header: 'Data Ke', key: 'data_number', width: 10 },
      { header: 'Keterangan', key: 'keterangan', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created By', key: 'created_by', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1AA62' }
    };

    records.forEach((record, index) => {
      worksheet.addRow({
        no: index + 1,
        tanggal: new Date(record.tanggal).toLocaleDateString('id-ID'),
        plant: record.plant,
        line: record.line,
        regu: record.regu,
        shift: record.shift,
        area: record.area,
        data_number: record.data_number,
        keterangan: record.keterangan || '',
        status: record.status,
        created_by: record.created_by
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Monitoring_All_${plant}_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    alert('Excel berhasil diekspor');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Gagal mengekspor ke Excel');
  }
};

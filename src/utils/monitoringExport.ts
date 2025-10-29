import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { MonitoringRecord } from './monitoringDatabase';

export const exportMonitoringToExcel = async (
  records: MonitoringRecord[],
  plant: string,
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
    link.download = `Monitoring_${plant}_${line}_Regu${regu}_Shift${shift}_${new Date().getTime()}.xlsx`;
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
  plant: string,
  line: string,
  regu: string,
  shift: string
): Promise<void> => {
  if (records.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  // Show loading indicator
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

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monitoring Area Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Plant: ${plant}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Line: ${line} | Regu: ${regu} | Shift: ${shift}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Tanggal: ${new Date(records[0].tanggal).toLocaleDateString('id-ID')}`, margin, yPosition);
    yPosition += 10;

    const areaGroups: { [area: string]: MonitoringRecord[] } = {};
    records.forEach(record => {
      if (!areaGroups[record.area]) {
        areaGroups[record.area] = [];
      }
      areaGroups[record.area].push(record);
    });

    for (const [area, areaRecords] of Object.entries(areaGroups)) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Area: ${area}`, margin, yPosition);
      yPosition += 8;

      areaRecords.sort((a, b) => a.data_number - b.data_number);

      for (const record of areaRecords) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Data ke-${record.data_number}`, margin + 5, yPosition);
        yPosition += 6;

        pdf.setFont('helvetica', 'normal');
        const keteranganLines = pdf.splitTextToSize(
          `Keterangan: ${record.keterangan || '-'}`,
          pageWidth - 2 * margin - 10
        );
        keteranganLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin + 5, yPosition);
          yPosition += 5;
        });

        yPosition += 3;

        if (record.foto_url) {
          try {
            if (yPosition > pageHeight - 80) {
              pdf.addPage();
              yPosition = margin;
            }

            // Add image directly without pre-loading
            const imgWidth = 60;
            const imgHeight = 45;
            pdf.addImage(record.foto_url, 'JPEG', margin + 5, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 5;
          } catch (error) {
            console.error('Error adding image:', error);
          }
        }

        yPosition += 5;
      }

      yPosition += 5;
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

    pdf.save(`Monitoring_${plant}_${line}_Regu${regu}_Shift${shift}_${new Date().getTime()}.pdf`);

    // Remove loading indicator
    const loading = document.getElementById('pdf-loading');
    if (loading) {
      document.body.removeChild(loading);
    }

    alert('PDF berhasil diekspor');
  } catch (error) {
    console.error('Error exporting to PDF:', error);

    // Remove loading indicator on error
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

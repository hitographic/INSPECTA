import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SanitationRecord } from '@/types/database';
import { Platform } from 'react-native';
import ExcelJS from 'exceljs';

// Convert image to buffer for ExcelJS
const getImageBuffer = async (uri: string): Promise<ArrayBuffer | null> => {
  try {
    if (Platform.OS === 'web') {
      // For web, if it's already a data URL, convert to buffer
      if (uri.startsWith('data:')) {
        const base64 = uri.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      
      // For web URLs, fetch and convert
      const response = await fetch(uri);
      return await response.arrayBuffer();
    } else {
      // For mobile, read file as base64 then convert to buffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
  } catch (error) {
    console.error('Error converting image to buffer:', error);
    return null;
  }
};

export const exportToCSV = async (records: SanitationRecord[]) => {
  try {
    // Group records by date and plant
    const recordsByDate = records.reduce((acc, record) => {
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
    workbook.lastModifiedBy = 'Sanitation App';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    for (const [key, group] of Object.entries(recordsByDate)) {
      // Create main worksheet
      const sheetName = `${group.plant}_${group.date}`.replace(/[^\w\s]/gi, '_');
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Set column widths
      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Line', key: 'line', width: 8 },
        { header: 'Area', key: 'area', width: 15 },
        { header: 'Bagian', key: 'bagian', width: 35 },
        { header: 'Foto Sebelum', key: 'fotoBefore', width: 20 },
        { header: 'Foto Setelah', key: 'fotoAfter', width: 20 },
        { header: 'Keterangan', key: 'keterangan', width: 50 }
      ];

      // Add header rows
      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'PT INDOFOOD CBP SUKSES MAKMUR TBK';
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:G2');
      worksheet.getCell('A2').value = 'BOGASARI FLOUR MILLS - QUALITY ASSURANCE';
      worksheet.getCell('A2').font = { bold: true, size: 12 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A3:G3');
      worksheet.getCell('A3').value = 'LAPORAN PELAKSANAAN SANITASI';
      worksheet.getCell('A3').font = { bold: true, size: 12 };
      worksheet.getCell('A3').alignment = { horizontal: 'center' };

      // Add plant and date info
      worksheet.getCell('A5').value = 'Pabrik:';
      worksheet.getCell('B5').value = group.plant;
      worksheet.getCell('A6').value = 'Hari/Tanggal:';
      worksheet.getCell('B6').value = group.date;

      // Add table headers at row 8
      const headerRow = worksheet.getRow(8);
      headerRow.values = ['No', 'Line', 'Area', 'Bagian', 'Foto Sebelum', 'Foto Setelah', 'Keterangan'];
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Add borders to header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Group by area and add data
      const areaGroups = group.records.reduce((acc, record) => {
        if (!acc[record.area]) {
          acc[record.area] = [];
        }
        acc[record.area].push(record);
        return acc;
      }, {} as { [key: string]: SanitationRecord[] });

      let currentRow = 9;
      let rowNumber = 1;

      for (const [area, areaRecords] of Object.entries(areaGroups)) {
        // Add area header
        const areaHeaderRow = worksheet.getRow(currentRow);
        areaHeaderRow.values = [area, '', '', '', '', '', ''];
        areaHeaderRow.font = { bold: true };
        areaHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6E6' }
        };
        
        // Add borders to area header
        areaHeaderRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        currentRow++;

        // Add records for this area
        for (const record of areaRecords) {
          const dataRow = worksheet.getRow(currentRow);
          dataRow.values = [
            rowNumber,
            record.line,
            '', // Area already shown in header
            record.bagian,
            record.photoBeforeUri ? 'Lihat gambar di bawah' : 'Tidak Ada',
            record.photoAfterUri ? 'Lihat gambar di bawah' : 'Tidak Ada',
            record.keterangan.replace(/\n/g, ' ')
          ];

          // Add borders to data row
          dataRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });

          // Set row height for images
          dataRow.height = 100;

          // Add images if available
          try {
            if (record.photoBeforeUri) {
              const beforeBuffer = await getImageBuffer(record.photoBeforeUri);
              if (beforeBuffer) {
                const beforeImageId = workbook.addImage({
                  buffer: beforeBuffer,
                  extension: 'jpeg',
                });
                
                worksheet.addImage(beforeImageId, {
                  tl: { col: 4, row: currentRow - 1 }, // Column E (0-indexed)
                  ext: { width: 120, height: 90 }
                });
              }
            }

            if (record.photoAfterUri) {
              const afterBuffer = await getImageBuffer(record.photoAfterUri);
              if (afterBuffer) {
                const afterImageId = workbook.addImage({
                  buffer: afterBuffer,
                  extension: 'jpeg',
                });
                
                worksheet.addImage(afterImageId, {
                  tl: { col: 5, row: currentRow - 1 }, // Column F (0-indexed)
                  ext: { width: 120, height: 90 }
                });
              }
            }
          } catch (error) {
            console.error('Error adding images for record:', record.id, error);
          }

          currentRow++;
          rowNumber++;
        }
      }

      // Add footer
      currentRow += 2;
      worksheet.getCell(`A${currentRow}`).value = 'Keterangan:';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = '- Foto sanitasi tertanam dalam laporan';
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = '- Laporan dibuat secara otomatis';
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = `- Dibuat pada: ${new Date().toLocaleString('id-ID')}`;
    }

    // Generate Excel file
    const fileName = `Laporan_Sanitasi_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (Platform.OS === 'web') {
      // For web platform
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // For mobile platform
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64',
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Share Excel File'
        });
      } else {
        console.log('Sharing is not available on this platform');
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Excel export error:', error);
    return false;
  }
};

export const exportToPDF = async (records: SanitationRecord[]) => {
  // Use Excel export for now
  console.log('Using Excel export instead of PDF');
  return await exportToCSV(records);
};
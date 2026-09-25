import * as XLSX from 'xlsx';

export const parseAttendanceExcel = async (
  file: File, 
  employees: any[], 
  findEmployeeId: (excelName: string, fallbackId: number) => number
): Promise<any[]> => {
  const dataBuffer = await file.arrayBuffer();
  const wb = XLSX.read(dataBuffer);
  const parsedRecords: any[] = [];
  
  for (const wsname of wb.SheetNames) {
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    if (!data || data.length === 0) continue;
    
    const sheetText = data.slice(0, 10).map(r => r.join(' ')).join(' ').toLowerCase();

    // FORMAT 1: "Catatan Kehadiran Karyawan" (Dates in a row)
    if (sheetText.includes("catatan kehadiran karyawan")) {
      let currentMonth = new Date().getMonth();
      let currentYear = new Date().getFullYear();
      
      const headerText = sheetText;
      const dateMatch = headerText.match(/(\d{4})\/(\d{2})\/(\d{2})/);
      if (dateMatch) {
        currentYear = parseInt(dateMatch[1]);
        currentMonth = parseInt(dateMatch[2]) - 1; 
      }
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || !row.length) continue;
        
        const strRow = Array.from(row).map(c => c ? String(c).toLowerCase().trim() : '');
        if (strRow.some(c => c && c.includes('user id'))) {
          const idIdx = strRow.findIndex(c => c && c.includes('user id'));
          const nameIdx = strRow.findIndex(c => c && c.includes('nama'));
          
          if (idIdx !== -1 && nameIdx !== -1) {
            const rawId = parseInt(String(row[idIdx + 1]));
            const excelName = String(row[nameIdx + 1] || '');
            if (isNaN(rawId)) continue;
            
            const userId = findEmployeeId(excelName, rawId);

            // Dates row could be next or +2
            const datesRow = data[i+1] || [];
            const timesRow = data[i+2] || [];
            
            for (let j = 0; j < datesRow.length; j++) {
              const dayVal = parseInt(String(datesRow[j]));
              if (!isNaN(dayVal) && dayVal >= 1 && dayVal <= 31) {
                const timeVal = timesRow[j];
                if (timeVal) {
                  const timeStr = String(timeVal);
                  const timeParts = timeStr.split('\n');
                  const time_in = timeParts[0] ? timeParts[0].trim() : null;
                  const time_out = timeParts[1] ? timeParts[1].trim() : null;
                  
                  const d = new Date(currentYear, currentMonth, dayVal);
                  parsedRecords.push({
                    employee_id: userId,
                    date: d.toISOString(),
                    time_in,
                    time_out,
                    status: time_in && time_out ? 'Present' : 'Abnormal',
                    notes: wsname,
                  });
                }
              }
            }
          }
        }
      }
    } 
    // FORMAT 2: "Analisa Kehadiran" (Summary Report)
    else if (sheetText.includes("analisa kehadiran")) {
      let idCol = -1, nameCol = -1, hadirCol = -1, telatCol = -1, absenCol = -1;
      for(let i=0; i<10; i++) {
         const r = data[i];
         if(!r) continue;
         const str = Array.from(r).map(c => c ? String(c).toLowerCase().trim() : '');
         if(idCol === -1) idCol = str.findIndex(c => c && c.includes('user id'));
         if(nameCol === -1) nameCol = str.findIndex(c => c && c.includes('nama'));
         if(hadirCol === -1) hadirCol = str.findIndex(c => c && c.includes('hari kehadiran'));
         if(telatCol === -1) telatCol = str.findIndex(c => c && c.includes('terlambat masuk'));
         if(absenCol === -1) absenCol = str.findIndex(c => c && c.includes('tidak hadir'));
      }

      if (idCol !== -1) {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || !row.length) continue;
          const rawId = parseInt(String(row[idCol]));
          const excelName = nameCol !== -1 ? String(row[nameCol] || '') : '';
          
          if (!isNaN(rawId) && rawId > 0) {
            const userId = findEmployeeId(excelName, rawId);
            const hadir = hadirCol !== -1 ? String(row[hadirCol] || '0') : '0';
            const telat = telatCol !== -1 ? String(row[telatCol] || '0') : '0';
            const absen = absenCol !== -1 ? String(row[absenCol] || '0') : '0';
            
            parsedRecords.push({
              employee_id: userId,
              date: new Date().toISOString(),
              time_in: '-',
              time_out: '-',
              status: 'Summary',
              notes: `Hadir: ${hadir}, Telat: ${telat}, Absen: ${absen}`,
            });
          }
        }
      }
    }
    // FORMAT 3: Default Tabular / "Kehadiran Tidak Normal"
    else {
      let idCol = -1, nameCol = -1, dateCol = -1, inCol = -1, outCol = -1, statusCol = -1;
      
      // Scan headers across first 10 rows
      for(let i=0; i<10; i++) {
         const r = data[i];
         if(!r) continue;
         const str = Array.from(r).map(c => c ? String(c).toLowerCase().trim() : '');
         if(idCol === -1) idCol = str.findIndex(c => c && c.includes('user id'));
         if(nameCol === -1) nameCol = str.findIndex(c => c && c.includes('nama'));
         if(dateCol === -1) dateCol = str.findIndex(c => c && c.includes('tanggal'));
         if(inCol === -1) inCol = str.findIndex(c => c && c.includes('masuk'));
         if(outCol === -1) outCol = str.findIndex(c => c && c.includes('keluar') && !c.includes('lebih'));
         if(statusCol === -1) statusCol = str.findIndex(c => c && c === 'catatan');
      }

      if (idCol !== -1 && dateCol !== -1) {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || !row.length) continue;
          
          const rawId = parseInt(String(row[idCol]));
          const excelName = nameCol !== -1 ? String(row[nameCol] || '') : '';
          const dateVal = row[dateCol];
          
          // Skip header rows
          if (!isNaN(rawId) && dateVal && typeof dateVal !== 'string' || (typeof dateVal === 'string' && dateVal.includes('/'))) {
            const userId = findEmployeeId(excelName, rawId);
            let d = new Date();
            if (typeof dateVal === 'number') {
              d = new Date((dateVal - 25569) * 86400 * 1000);
            } else {
              d = new Date(dateVal);
            }
            
            if (!isNaN(d.getTime())) {
              parsedRecords.push({
                employee_id: userId,
                date: d.toISOString(),
                time_in: inCol !== -1 && row[inCol] ? String(row[inCol]) : null,
                time_out: outCol !== -1 && row[outCol] ? String(row[outCol]) : null,
                status: statusCol !== -1 && row[statusCol] ? String(row[statusCol]) : 'Present',
                notes: wsname,
              });
            }
          }
        }
      }
    }
  } // end sheet loop
  
  return parsedRecords;
}

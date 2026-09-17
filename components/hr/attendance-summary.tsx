'use client';

import { useState, useRef } from 'react';
import { useAttendanceSummaries, useImportAttendanceSummaries, useEmployees } from './queries';
import { Search, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import * as XLSX from 'xlsx';

export function AttendanceSummary() {
  const { t } = useLanguage();
  const { data: summaries, isLoading } = useAttendanceSummaries();
  const { data: employees } = useEmployees();
  const importMutation = useImportAttendanceSummaries();
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findEmployeeId = (excelName: string, fallbackId: number) => {
    if (!employees || !excelName) return fallbackId;
    const nameLower = excelName.toLowerCase().trim();
    const match = employees.find((e: any) => {
      const eName = (e.name || '').toLowerCase();
      const eFirst = (e.firstname || '').toLowerCase();
      return eName.includes(nameLower) || nameLower.includes(eName) || eFirst.includes(nameLower);
    });
    return match ? match.id : fallbackId;
  };

  const filtered = summaries?.filter((a: any) => 
    a.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataBuffer = await file.arrayBuffer();
      const wb = XLSX.read(dataBuffer);
      const parsedRecords: any[] = [];
      let period = '';
      
      for (const wsname of wb.SheetNames) {
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (!data || data.length === 0) continue;
        
        // Find period from first few rows
        for(let i=0; i<5; i++) {
          const rowStr = data[i]?.join(' ') || '';
          if (rowStr.toLowerCase().includes('tanggal statistik:')) {
             const m = rowStr.match(/(\d{4}\/\d{2}\/\d{2}~\d{4}\/\d{2}\/\d{2})/);
             if (m) period = m[1];
          }
        }

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || !row.length) continue;
          
          // Data rows start when the first column is a number (User ID)
          const rawId = parseInt(String(row[0]));
          if (!isNaN(rawId) && rawId > 0 && typeof row[1] === 'string') {
            const excelName = String(row[1] || '').trim();
            const userId = findEmployeeId(excelName, rawId);

            // Using indexes based on the standard "Analisa Kehadiran" ZKTeco export format:
            // 0: User ID, 1: Nama, 2: Departemen
            // 3: Jam Kerja (Standar), 4: Jam Kerja (Aktual)
            // 5: Terlambat Masuk (Jam), 6: (Menit)
            // 7: Keluar Awal (Jam), 8: (Menit)
            // 9: Lembur (Normal), 10: (Khusus)
            // 11: Hari Kehadiran (Standar/Aktual)
            // 12: Perjalanan Bisnis, 13: Tidak hadir, 14: Cuti, 15: Presentase Kehadiran
            
            // Extract standard/actual attendance days (e.g., "21/17")
            let attStd = 0, attAct = 0;
            const attStr = String(row[11] || '');
            if (attStr.includes('/')) {
               const parts = attStr.split('/');
               attStd = parseFloat(parts[0]);
               attAct = parseFloat(parts[1]);
            } else {
               attStd = parseFloat(attStr) || 0;
            }

            parsedRecords.push({
              employee_id: userId,
              period: period || new Date().toISOString().substring(0, 7),
              department: String(row[2] || ''),
              work_hours_standard: parseFloat(String(row[3])) || 0,
              work_hours_actual: parseFloat(String(row[4])) || 0,
              late_hours: parseInt(String(row[5])) || 0,
              late_minutes: parseInt(String(row[6])) || 0,
              early_leave_hours: parseInt(String(row[7])) || 0,
              early_leave_minutes: parseInt(String(row[8])) || 0,
              overtime_normal: parseFloat(String(row[9])) || 0,
              overtime_special: parseFloat(String(row[10])) || 0,
              attendance_days_standard: attStd,
              attendance_days_actual: attAct,
              business_trip_days: parseInt(String(row[12])) || 0,
              absent_days: parseInt(String(row[13])) || 0,
              leave_days: parseInt(String(row[14])) || 0,
              percentage: parseFloat(String(row[15])) || 0
            });
          }
        }
      }

      if (parsedRecords.length === 0) {
        toast.error(t('No valid attendance data found in the file.'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      toast.promise(importMutation.mutateAsync(parsedRecords), {
        loading: t('Importing...'),
        success: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return t('Successfully imported summary records.');
        },
        error: (err: any) => {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return err.message || t('Failed to import data.');
        }
      });

    } catch (err: any) {
      console.error("Excel parse error:", err);
      toast.error(`${t('Error parsing file.')} ${err.message || ''}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder={`${t('Search')}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-transparent"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {t('Import Analisa Kehadiran')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t('Loading')}...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 font-medium border-r">{t('Name')}</th>
                  <th rowSpan={2} className="px-4 py-3 font-medium border-r">{t('Department')}</th>
                  <th rowSpan={2} className="px-4 py-3 font-medium border-r">{t('Period')}</th>
                  <th colSpan={2} className="px-4 py-2 font-medium text-center border-b border-r">{t('Work Hours')}</th>
                  <th colSpan={2} className="px-4 py-2 font-medium text-center border-b border-r">{t('Late')}</th>
                  <th colSpan={2} className="px-4 py-2 font-medium text-center border-b border-r">{t('Early Leave')}</th>
                  <th rowSpan={2} className="px-4 py-3 font-medium border-r text-center">{t('Attendance Days (Std/Act)')}</th>
                  <th rowSpan={2} className="px-4 py-3 font-medium border-r text-center">{t('Absent')}</th>
                  <th rowSpan={2} className="px-4 py-3 font-medium text-center">{t('Leave')}</th>
                </tr>
                <tr>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Standard')}</th>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Actual')}</th>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Hours')}</th>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Minutes')}</th>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Hours')}</th>
                  <th className="px-4 py-2 font-medium bg-muted/30 border-r">{t('Minutes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered?.map((att: any) => (
                  <tr key={att.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground border-r">{att.employee?.name}</td>
                    <td className="px-4 py-3 border-r">{att.department || '-'}</td>
                    <td className="px-4 py-3 border-r text-xs whitespace-nowrap">{att.period || '-'}</td>
                    <td className="px-4 py-3 border-r text-center">{att.work_hours_standard}</td>
                    <td className="px-4 py-3 border-r text-center">{att.work_hours_actual}</td>
                    <td className="px-4 py-3 border-r text-center text-orange-500">{att.late_hours}</td>
                    <td className="px-4 py-3 border-r text-center text-orange-500">{att.late_minutes}</td>
                    <td className="px-4 py-3 border-r text-center text-red-500">{att.early_leave_hours}</td>
                    <td className="px-4 py-3 border-r text-center text-red-500">{att.early_leave_minutes}</td>
                    <td className="px-4 py-3 border-r text-center font-medium">{att.attendance_days_standard} / {att.attendance_days_actual}</td>
                    <td className="px-4 py-3 border-r text-center text-red-600 dark:text-red-400 font-bold">{att.absent_days}</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">{att.leave_days}</td>
                  </tr>
                ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      {t('No records found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

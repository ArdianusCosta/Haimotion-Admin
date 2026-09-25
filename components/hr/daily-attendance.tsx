'use client';

import { useState, useRef } from 'react';
import { useAttendances, useImportAttendances, useEmployees } from './queries';
import { Search, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { parseAttendanceExcel } from './services/excel-parser';

export function DailyAttendance() {
  const { t, formatDate } = useLanguage();
  const { data: attendances, isLoading } = useAttendances();
  const { data: employees } = useEmployees();
  const importMutation = useImportAttendances();
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

  const filtered = attendances?.filter((a: any) => 
    a.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRecords = await parseAttendanceExcel(file, employees || [], findEmployeeId);
        
      if (parsedRecords.length === 0) {
        toast.error(t('No valid attendance data found in the file.'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      importMutation.mutate(parsedRecords, {
        onSuccess: () => {
          toast.success(t('Successfully imported attendance records.'));
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err: any) => {
          toast.error(err.message || t('Failed to import data.'));
          if (fileInputRef.current) fileInputRef.current.value = '';
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
            className="gap-2"
          >
            {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {t('Import Excel')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t('Loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('Name')}</th>
                  <th className="px-6 py-4 font-medium">{t('Date')}</th>
                  <th className="px-6 py-4 font-medium">{t('Time In')}</th>
                  <th className="px-6 py-4 font-medium">{t('Time Out')}</th>
                  <th className="px-6 py-4 font-medium">{t('Status')}</th>
                  <th className="px-6 py-4 font-medium">{t('Notes')} / {t('Details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered?.map((att: any) => (
                  <tr key={att.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{att.employee?.name}</td>
                    <td className="px-6 py-4">{formatDate(att.date)}</td>
                    <td className="px-6 py-4">{att.time_in || '-'}</td>
                    <td className="px-6 py-4">{att.time_out || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        att.status === 'Present' || att.status === 'Normal' || att.status === 'Hadir' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        att.status === 'Late' || att.status === 'Terlambat' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        att.status === 'Summary' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t(att.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate" title={att.notes}>
                      {att.notes || '-'}
                    </td>
                  </tr>
                ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {t('No data found')}
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

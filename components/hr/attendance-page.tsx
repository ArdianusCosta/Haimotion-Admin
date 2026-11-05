'use client';

import { HRPageHeader } from './components';
import { useLanguage } from '@/components/language-provider';
import { LeaveRequests } from './leave-requests';

export function AttendancePage() {
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto w-full min-w-0 max-w-full">
      <div className="w-full space-y-6 min-w-0 max-w-full">
        <HRPageHeader 
          title={t('Pengajuan Cuti & Izin')} 
          description={t('Kelola permohonan cuti tahunan, izin kerja, dan surat sakit karyawan.')}
        />

        <div className="focus-visible:outline-none focus-visible:ring-0 min-w-0 max-w-full">
          <LeaveRequests />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { HRPageHeader } from './components';
import { useLanguage } from '@/components/language-provider';
import { DailyAttendance } from './daily-attendance';
import { LeaveRequests } from './leave-requests';
import { AttendanceSummary } from './attendance-summary';
import { Briefcase, CalendarClock, Table2 } from 'lucide-react';

export function AttendancePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'daily' | 'summary' | 'leaves'>('daily');

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <HRPageHeader 
          title={t('Attendance')} 
          description={t('Manage employee leave requests and attendance records.')}
        />

        <div className="border-b border-border mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('daily')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'daily' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarClock className="size-4" />
              {t('Daily Attendance')}
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'summary' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table2 className="size-4" />
              {t('Attendance Summary')}
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'leaves' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="size-4" />
              {t('Leave Requests')}
            </button>
          </div>
        </div>

        <div className="focus-visible:outline-none focus-visible:ring-0">
          {activeTab === 'daily' && <DailyAttendance />}
          {activeTab === 'summary' && <AttendanceSummary />}
          {activeTab === 'leaves' && <LeaveRequests />}
        </div>
      </div>
    </div>
  );
}

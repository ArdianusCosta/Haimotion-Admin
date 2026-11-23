'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEmployees, useLeaves, useHrOverview } from './queries';
import { HRPageHeader, LeaveStatusBadge, EmployeeStatusBadge } from './components';
import { Users, CalendarRange, Building2, UserCheck, ArrowRight, ChevronRight } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useLanguage } from '@/components/language-provider';

const hiringTrends = [
  { month: 'Jan', hires: 2 }, { month: 'Feb', hires: 4 },
  { month: 'Mar', hires: 3 }, { month: 'Apr', hires: 7 },
  { month: 'May', hires: 5 }, { month: 'Jun', hires: 8 },
]
const chartConfig = { count: { label: 'Employees', color: 'var(--chart-1)' }, hires: { label: 'New Hires', color: 'var(--chart-2)' } } satisfies ChartConfig

export function HROverviewPage() {
  const router = useRouter();
  const { t, formatDate } = useLanguage();
  const { data: employees, isLoading: loadingEmp } = useEmployees();
  const { data: leaves, isLoading: loadingLeaves } = useLeaves();
  const { data: overview, isLoading: loadingOverview } = useHrOverview();

  if (loadingEmp || loadingLeaves || loadingOverview) {
    return <div className="p-8 text-center text-muted-foreground">Loading HR Overview...</div>;
  }

  const activeEmployees = employees?.filter((e: any) => e.status === 'Active').length || 0;
  const pendingLeaves = overview?.activeLeaveRequests || 0;

  const deptCount = employees?.reduce((acc: any, emp: any) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const deptData = Object.entries(deptCount).map(([dept, count]) => ({ department: dept, count }));

  const recentLeaves = leaves?.slice(0, 4) || [];
  const recentEmployees = employees?.slice(0, 4) || [];

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="w-full space-y-6">
        <HRPageHeader 
          title={t('HR Overview')} 
          description={t('A quick glance at human resources statistics and activities.')}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            onClick={() => router.push('/hr/employees')}
            className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
            title="Buka Data Employees"
          >
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium group-hover:text-primary transition-colors">{t('Total Employees')}</h3>
              <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-bold">{overview?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeEmployees} {t('active')}
            </p>
          </div>

          <div 
            onClick={() => router.push('/hr/employees')}
            className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
            title="Buka Data Employees"
          >
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium group-hover:text-primary transition-colors">{t('Karyawan Aktif')}</h3>
              <UserCheck className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('Siap & bertugas aktif')}
            </p>
          </div>
          
          <div 
            onClick={() => router.push('/hr/attendance')}
            className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
            title="Buka Pengajuan Cuti & Izin"
          >
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium group-hover:text-primary transition-colors">{t('Leave Requests')}</h3>
              <CalendarRange className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-bold">{pendingLeaves}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pending approval')}
            </p>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium">{t('Departments')}</h3>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{Object.keys(deptCount).length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('Across the organization')}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">{t('Employee Distribution')}</h3>
              <p className="text-sm text-muted-foreground">{t('Headcount by department')}</p>
            </div>
            <div className="p-6 pt-0">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={deptData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">{t('Hiring Trends')}</h3>
              <p className="text-sm text-muted-foreground">{t('New hires over the last 6 months')}</p>
            </div>
            <div className="p-6 pt-0">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={hiringTrends} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-hires)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-hires)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="hires" stroke="var(--color-hires)" fillOpacity={1} fill="url(#colorHires)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="space-y-1">
                <h3 className="font-semibold leading-none tracking-tight">{t('Recent Leave Requests')}</h3>
                <p className="text-xs text-muted-foreground">{t('Permohonan cuti dan izin kerja terkini')}</p>
              </div>
              <Link 
                href="/hr/attendance"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group cursor-pointer"
              >
                <span>{t('View all')}</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border">
                {recentLeaves.map(leave => (
                  <div 
                    key={leave.id} 
                    onClick={() => router.push('/hr/attendance')}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    title="Buka Pengajuan Cuti & Izin"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{leave.employee?.name}</span>
                      <span className="text-xs text-muted-foreground">{leave.type} • {formatDate(leave.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeaveStatusBadge status={leave.status} />
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
                {recentLeaves.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">{t('No data found')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="space-y-1">
                <h3 className="font-semibold leading-none tracking-tight">{t('Recent Employees')}</h3>
                <p className="text-xs text-muted-foreground">{t('Daftar staf dan karyawan yang terdaftar')}</p>
              </div>
              <Link 
                href="/hr/employees"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group cursor-pointer"
              >
                <span>{t('View all')}</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border">
                {recentEmployees.map((emp: any) => (
                  <div 
                    key={emp.id} 
                    onClick={() => router.push('/hr/employees')}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                    title="Buka Data Employees"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EM'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.department || emp.position || 'Staff'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EmployeeStatusBadge status={emp.status} />
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
                {recentEmployees.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">{t('No data found')}</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

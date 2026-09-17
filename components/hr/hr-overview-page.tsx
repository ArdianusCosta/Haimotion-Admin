import { useEmployees, useLeaves, useCandidates, useHrOverview } from './queries';
import { HRPageHeader, LeaveStatusBadge } from './components';
import { Users, CalendarRange, Building2, Briefcase, Clock } from 'lucide-react';
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
  const { t, formatDate } = useLanguage();
  const { data: employees, isLoading: loadingEmp } = useEmployees();
  const { data: leaves, isLoading: loadingLeaves } = useLeaves();
  const { data: candidates, isLoading: loadingCandidates } = useCandidates();
  const { data: overview, isLoading: loadingOverview } = useHrOverview();

  if (loadingEmp || loadingLeaves || loadingCandidates || loadingOverview) {
    return <div className="p-8 text-center text-muted-foreground">Loading HR Overview...</div>;
  }

  const activeEmployees = employees?.filter((e: any) => e.status === 'Active').length || 0;
  const pendingLeaves = overview?.activeLeaveRequests || 0;
  const openInterviews = candidates?.filter((c: any) => c.status === 'Interview').length || 0;

  const deptCount = employees?.reduce((acc: any, emp: any) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const deptData = Object.entries(deptCount).map(([dept, count]) => ({ department: dept, count }));

  const recentLeaves = leaves?.slice(0, 4) || [];
  const recentInterviews = candidates?.filter((c: any) => c.status === 'Interview').slice(0, 4) || [];

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <HRPageHeader 
          title={t('HR Overview')} 
          description={t('A quick glance at human resources statistics and activities.')}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium">{t('Total Employees')}</h3>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{overview?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeEmployees} {t('active')}
            </p>
          </div>
          
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium">{t('Leave Requests')}</h3>
              <CalendarRange className="w-4 h-4 text-muted-foreground" />
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

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between pb-2 space-y-0">
              <h3 className="tracking-tight text-sm font-medium">{t('Interviews')}</h3>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{openInterviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('upcoming sessions')}
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
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <h3 className="font-semibold leading-none tracking-tight">{t('Recent Leave Requests')}</h3>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border">
                {recentLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{leave.employee?.name}</span>
                      <span className="text-xs text-muted-foreground">{leave.type} • {formatDate(leave.start_date)}</span>
                    </div>
                    <LeaveStatusBadge status={leave.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <h3 className="font-semibold leading-none tracking-tight">{t('Upcoming Interviews')}</h3>
            </div>
            <div className="p-0">
              <div className="divide-y divide-border">
                {recentInterviews.map(candidate => (
                  <div key={candidate.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{candidate.name}</span>
                      <span className="text-xs text-muted-foreground">{candidate.role_applied}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                      <Clock className="size-3" /> Scheduled
                    </div>
                  </div>
                ))}
                {recentInterviews.length === 0 && (
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

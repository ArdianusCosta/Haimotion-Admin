'use client';

import { useState, useMemo } from 'react';
import { 
  useLeaves, 
  useEmployees,
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useUpdateLeaveStatus,
  useDeleteLeaveRequest
} from './queries';
import { 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar, 
  AlertCircle,
  FileText,
  HeartPulse,
  CalendarDays,
  Briefcase,
  UserCheck,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { LeaveRequestModal, ConfirmDeleteDialog, ProofPreviewModal } from './components/modals';

export function LeaveRequests() {
  const { t, formatDate } = useLanguage();
  const { data: leaves = [], isLoading } = useLeaves();
  const { data: employees = [] } = useEmployees();

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const deleteMutation = useDeleteLeaveRequest();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'cuti' | 'izin' | 'sakit' | 'approved' | 'rejected'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

  // Statistics calculation for KPI cards
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l: any) => (l.status || 'Pending').toLowerCase() === 'pending').length;
    const approved = leaves.filter((l: any) => (l.status || '').toLowerCase() === 'approved').length;
    const cuti = leaves.filter((l: any) => {
      const type = (l.type || '').toLowerCase();
      return type.includes('cuti') || type.includes('leave');
    }).length;
    const sakit = leaves.filter((l: any) => {
      const type = (l.type || '').toLowerCase();
      return type.includes('sakit') || type.includes('sick');
    }).length;
    const izin = leaves.filter((l: any) => {
      const type = (l.type || '').toLowerCase();
      return type.includes('izin') || type.includes('permit');
    }).length;

    return { total, pending, approved, cuti, sakit, izin };
  }, [leaves]);

  // Tab items configuration
  const tabItems = [
    { key: 'all', label: 'Semua Permohonan', count: stats.total, icon: FileText },
    { key: 'pending', label: 'Perlu Persetujuan', count: stats.pending, icon: Clock, badgeVariant: 'warning' },
    { key: 'cuti', label: 'Cuti Tahunan', count: stats.cuti, icon: CalendarDays },
    { key: 'izin', label: 'Izin Kerja', count: stats.izin, icon: Briefcase },
    { key: 'sakit', label: 'Sakit', count: stats.sakit, icon: HeartPulse },
    { key: 'approved', label: 'Disetujui', icon: CheckCircle2 },
    { key: 'rejected', label: 'Ditolak', icon: XCircle },
  ] as const;

  // Filtered leaves according to tab and search
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l: any) => {
      const matchesSearch = 
        (l.employee?.name && l.employee.name.toLowerCase().includes(search.toLowerCase())) || 
        (l.type && l.type.toLowerCase().includes(search.toLowerCase())) ||
        (l.employee?.department && l.employee.department.toLowerCase().includes(search.toLowerCase())) ||
        (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      const status = (l.status || 'Pending').toLowerCase();
      const type = (l.type || '').toLowerCase();

      switch (activeTab) {
        case 'pending':
          return status === 'pending';
        case 'approved':
          return status === 'approved';
        case 'rejected':
          return status === 'rejected';
        case 'cuti':
          return type.includes('cuti') || type.includes('leave');
        case 'izin':
          return type.includes('izin') || type.includes('permit');
        case 'sakit':
          return type.includes('sakit') || type.includes('sick');
        case 'all':
        default:
          return true;
      }
    });
  }, [leaves, search, activeTab]);

  const handleSaveLeave = async (formData: any) => {
    try {
      if (formData.id) {
        await updateMutation.mutateAsync({
          id: formData.id,
          data: formData
        });
        toast.success(t('Permohonan izin / cuti berhasil diperbarui'));
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t('Permohonan izin / cuti berhasil diajukan'));
      }
      setIsModalOpen(false);
      setSelectedLeave(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menyimpan permohonan'));
    }
  };

  const handleQuickStatus = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(
        status === 'Approved'
          ? t('Permohonan izin / cuti telah disetujui')
          : t('Permohonan izin / cuti telah ditolak')
      );
    } catch (err: any) {
      toast.error(err.message || t('Gagal mengubah status'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success(t('Permohonan izin / cuti berhasil dihapus'));
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menghapus permohonan'));
    }
  };

  const calculateDays = (start: string | Date, end: string | Date) => {
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      return diffDays;
    } catch {
      return 1;
    }
  };

  // Leave Type Badge with clean Lucide icons (No Emojis)
  const getLeaveTypeBadge = (type: string) => {
    const tLower = (type || '').toLowerCase();
    if (tLower.includes('sakit') || tLower.includes('sick')) {
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25">
          <HeartPulse className="size-3.5 shrink-0" />
          <span>{type}</span>
        </Badge>
      );
    }
    if (tLower.includes('izin') || tLower.includes('permit')) {
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25">
          <FileText className="size-3.5 shrink-0" />
          <span>{type}</span>
        </Badge>
      );
    }
    if (tLower.includes('khusus')) {
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
          <Briefcase className="size-3.5 shrink-0" />
          <span>{type}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
        <CalendarDays className="size-3.5 shrink-0" />
        <span>{type}</span>
      </Badge>
    );
  };

  // Status Badge with clean Lucide icons (No Emojis)
  const getStatusBadge = (status: string) => {
    const sLower = (status || 'Pending').toLowerCase();
    if (sLower === 'approved') {
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{t('Disetujui')}</span>
        </Badge>
      );
    }
    if (sLower === 'rejected') {
      return (
        <Badge variant="outline" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
          <XCircle className="size-3.5 shrink-0" />
          <span>{t('Ditolak')}</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
        <Clock className="size-3.5 shrink-0 animate-pulse" />
        <span>{t('Menunggu Review')}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* 1. TOP METRIC CARDS (Shadcn Card components) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Permohonan */}
        <Card 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer transition-all duration-200 border-border hover:border-primary/40 hover:shadow-md ${
            activeTab === 'all' ? 'ring-2 ring-primary/20 bg-muted/20' : ''
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Permohonan
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.total}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Semua permohonan diajukan
              </p>
            </div>
            <div className="size-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CalendarDays className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Menunggu Review */}
        <Card 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer transition-all duration-200 border-border hover:border-amber-500/40 hover:shadow-md ${
            activeTab === 'pending' ? 'ring-2 ring-amber-500/30 bg-amber-500/5' : ''
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Perlu Review
                </p>
                {stats.pending > 0 && (
                  <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.pending}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Menunggu persetujuan HR
              </p>
            </div>
            <div className="size-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Cuti Tahunan & Khusus */}
        <Card 
          onClick={() => setActiveTab('cuti')}
          className={`cursor-pointer transition-all duration-200 border-border hover:border-emerald-500/40 hover:shadow-md ${
            activeTab === 'cuti' ? 'ring-2 ring-emerald-500/30 bg-emerald-500/5' : ''
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cuti Tahunan
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.cuti}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cuti tahunan & khusus
              </p>
            </div>
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Calendar className="size-6" />
            </div>
          </CardContent>
        </Card>

        {/* Izin & Sakit */}
        <Card 
          onClick={() => setActiveTab('sakit')}
          className={`cursor-pointer transition-all duration-200 border-border hover:border-purple-500/40 hover:shadow-md ${
            activeTab === 'sakit' ? 'ring-2 ring-purple-500/30 bg-purple-500/5' : ''
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Izin & Sakit
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {stats.sakit + stats.izin}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {stats.sakit} sakit · {stats.izin} izin
              </p>
            </div>
            <div className="size-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <HeartPulse className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. TAB CONTROLS (Shadcn Segmented Tab Style - Clean & Responsive) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/60 overflow-x-auto scrollbar-none">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isWarning = (tab as any).badgeVariant === 'warning' && (tab.count || 0) > 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all select-none whitespace-nowrap ${
                isActive
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              <Icon className={`size-3.5 ${
                isActive ? 'text-primary' : isWarning ? 'text-amber-500' : 'text-muted-foreground'
              }`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isWarning
                    ? 'bg-amber-500 text-white'
                    : isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TOOLBAR: SEARCH & CREATE ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Cari nama karyawan, jenis, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-card border-border h-10 rounded-xl text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Primary Action Button: Ajukan Permohonan */}
        <Button 
          onClick={() => {
            setSelectedLeave(null);
            setIsModalOpen(true);
          }}
          className="gap-2 h-10 px-5 rounded-xl font-semibold shadow-sm hover:shadow transition-all shrink-0"
        >
          <Plus className="size-4" />
          <span>Ajukan Izin / Cuti</span>
        </Button>
      </div>

      {/* 4. DATA TABLE (Clean & Modern Shadcn-style Card) */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">{t('Karyawan')}</th>
                <th className="px-5 py-3.5">{t('Jenis Permohonan')}</th>
                <th className="px-5 py-3.5">{t('Periode & Durasi')}</th>
                <th className="px-5 py-3.5">{t('Alasan / Keterangan')}</th>
                <th className="px-5 py-3.5">{t('Surat / Dokumen')}</th>
                <th className="px-5 py-3.5">{t('Status Persetujuan')}</th>
                <th className="px-5 py-3.5 text-right">{t('Aksi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-in fade-in duration-300">
                    <td className="px-5 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeaves?.map((leave: any) => {
                const isPending = (leave.status || 'Pending').toLowerCase() === 'pending';
                const totalDays = calculateDays(leave.start_date, leave.end_date);
                const hasAttachment = Boolean(leave.attachment);

                return (
                  <tr key={leave.id} className="hover:bg-muted/30 transition-colors group">
                    {/* Karyawan */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {leave.employee?.name ? leave.employee.name.slice(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                            {leave.employee?.name || 'Tanpa Nama'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {leave.employee?.department || leave.employee?.position || 'Karyawan'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Jenis Permohonan */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getLeaveTypeBadge(leave.type)}
                    </td>

                    {/* Periode & Durasi */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{formatDate(leave.start_date)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatDate(leave.end_date)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Total {totalDays} hari kerja
                        </p>
                      </div>
                    </td>

                    {/* Alasan / Keterangan */}
                    <td className="px-5 py-4 max-w-[220px] text-xs text-foreground font-normal" title={leave.reason}>
                      <span className="line-clamp-2 leading-relaxed">
                        {leave.reason || '-'}
                      </span>
                    </td>

                    {/* Surat / Dokumen Bukti */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {hasAttachment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewAttachment({
                            url: leave.attachment,
                            name: leave.employee?.name || 'Karyawan',
                            type: leave.type
                          })}
                          className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Eye className="size-3.5" />
                          <span>Lihat Surat</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">-</span>
                      )}
                    </td>

                    {/* Status Persetujuan */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Approve / Reject for Pending */}
                        {isPending && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatus(leave.id, 'Approved')}
                              disabled={updateStatus.isPending}
                              className="size-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15"
                              title="Setujui Permohonan"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatus(leave.id, 'Rejected')}
                              disabled={updateStatus.isPending}
                              className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/15"
                              title="Tolak Permohonan"
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </>
                        )}

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setIsModalOpen(true);
                          }}
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit Permohonan"
                        >
                          <Pencil className="size-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({
                            id: leave.id,
                            name: `${leave.employee?.name || 'Karyawan'} (${leave.type})`
                          })}
                          className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          title="Hapus Permohonan"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeaves?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">
                        Tidak ada data permohonan pada kategori ini
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Belum ada permohonan izin atau cuti yang diajukan. Klik tombol di bawah untuk membuat pengajuan baru.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLeave(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-xs gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        Ajukan Permohonan Baru
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Request Form Modal (TanStack Query Create / Update) */}
      {isModalOpen && (
        <LeaveRequestModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLeave(null);
          }}
          onSave={handleSaveLeave}
          leave={selectedLeave}
          employees={employees}
        />
      )}

      {/* Confirmation Delete Dialog (TanStack Query Delete) */}
      {deleteConfirm && (
        <ConfirmDeleteDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Hapus Permohonan Izin / Cuti?"
          description={`Apakah Anda yakin ingin menghapus permohonan untuk ${deleteConfirm.name}? Tindakan ini tidak dapat dibatalkan.`}
          isPending={deleteMutation.isPending}
        />
      )}

      {/* Document / Doctor's Note Preview Modal */}
      {previewAttachment && (
        <ProofPreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          proofUrl={previewAttachment.url}
          employeeName={previewAttachment.name}
          title={`Surat Dokter / Lampiran ${previewAttachment.type}`}
          subtitle={`Dokumen pendukung untuk ${previewAttachment.name}`}
        />
      )}
    </div>
  );
}

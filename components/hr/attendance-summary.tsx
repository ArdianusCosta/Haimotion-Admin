'use client';

import { useState } from 'react';
import { 
  useAttendanceSummaries, 
  useEmployees, 
  useCreateAttendanceSummary, 
  useUpdateAttendanceSummary, 
  useDeleteAttendanceSummary 
} from './queries';
import { 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  Clock, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Percent,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { AttendanceSummaryModal, ConfirmDeleteDialog } from './components/modals';

export function AttendanceSummary() {
  const { t } = useLanguage();
  const { data: summaries, isLoading } = useAttendanceSummaries();
  const { data: employees = [] } = useEmployees();

  const createMutation = useCreateAttendanceSummary();
  const updateMutation = useUpdateAttendanceSummary();
  const deleteMutation = useDeleteAttendanceSummary();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  // Filtered summaries
  const filtered = summaries?.filter((sum: any) => {
    const matchesSearch = 
      sum.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sum.department?.toLowerCase().includes(search.toLowerCase()) ||
      sum.period?.toLowerCase().includes(search.toLowerCase()) ||
      (sum.notes && sum.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const approval = (sum.status || 'Approved').toLowerCase();
    if (statusFilter === 'pending') return approval === 'pending';
    if (statusFilter === 'approved') return approval === 'approved';
    if (statusFilter === 'rejected') return approval === 'rejected';

    return true;
  });

  const pendingCount = summaries?.filter((s: any) => (s.status || 'Approved').toLowerCase() === 'pending').length || 0;

  const handleSaveSummary = async (formData: any) => {
    try {
      if (formData.id) {
        await updateMutation.mutateAsync({
          id: formData.id,
          data: formData
        });
        toast.success(t('Rekap kehadiran berhasil diperbarui'));
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t('Rekap kehadiran berhasil ditambahkan'));
      }
      setIsModalOpen(false);
      setSelectedSummary(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menyimpan rekap kehadiran'));
    }
  };

  const handleQuickStatusChange = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status }
      });
      toast.success(
        status === 'Approved'
          ? t('Rekap kehadiran telah disetujui')
          : t('Rekap kehadiran telah ditolak')
      );
    } catch (err: any) {
      toast.error(err.message || t('Gagal memperbarui status rekap'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success(t('Rekap kehadiran berhasil dihapus'));
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menghapus rekap kehadiran'));
    }
  };

  const getPercentageBadge = (pct: number) => {
    const score = Number(pct || 0);
    if (score >= 95) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <TrendingUp className="size-3" />
          {score}%
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
          {score}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
        {score}%
      </span>
    );
  };

  const getApprovalBadge = (status: string) => {
    const statusLower = (status || 'Approved').toLowerCase();
    if (statusLower === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="size-3.5" />
          {t('Disetujui')}
        </span>
      );
    }
    if (statusLower === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="size-3.5" />
          {t('Ditolak')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <Clock className="size-3.5 animate-pulse" />
        {t('Pending')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar: Search, Filters & Action Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`${t('Cari nama, periode, atau divisi')}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10 rounded-xl"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Disetujui
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ditolak
            </button>
          </div>
        </div>
        
        {/* CRUD Action: Add Attendance Summary */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button 
            onClick={() => {
              setSelectedSummary(null);
              setIsModalOpen(true);
            }}
            className="gap-2 h-10 px-5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="size-4" />
            {t('Input Rekap Kehadiran')}
          </Button>
        </div>
      </div>

      {/* Modern Attendance Summary Table */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-5 py-4 font-semibold">{t('Karyawan')}</th>
                <th className="px-5 py-4 font-semibold">{t('Periode')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Kehadiran (Aktual/Standar)')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Jam Kerja')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Terlambat')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Izin / Cuti')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Alpha')}</th>
                <th className="px-5 py-4 font-semibold text-center">{t('Persentase')}</th>
                <th className="px-5 py-4 font-semibold">{t('Status')}</th>
                <th className="px-5 py-4 font-semibold text-right">{t('Aksi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-in fade-in duration-500">
                    <td className="px-5 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-12 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-12 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered?.map((sum: any) => {
                const isPending = (sum.status || 'Approved').toLowerCase() === 'pending';

                return (
                  <tr key={sum.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Karyawan & Departemen */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {sum.employee?.name ? sum.employee.name.slice(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{sum.employee?.name || 'Tanpa Nama'}</div>
                          <div className="text-xs text-muted-foreground">{sum.department || sum.employee?.department || '-'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Periode */}
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">
                      <div className="inline-flex items-center gap-1.5 text-xs bg-muted/30 px-2 py-1 rounded-md">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {sum.period || '-'}
                      </div>
                    </td>

                    {/* Hari Kehadiran */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-foreground">{sum.attendance_days_actual ?? 0}</span>
                      <span className="text-muted-foreground text-xs"> / {sum.attendance_days_standard ?? 0} hari</span>
                    </td>

                    {/* Jam Kerja */}
                    <td className="px-5 py-4 text-center whitespace-nowrap text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{sum.work_hours_actual ?? 0}</span> / {sum.work_hours_standard ?? 0} jam
                    </td>

                    {/* Keterlambatan */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {(sum.late_minutes ?? 0) > 0 || (sum.late_hours ?? 0) > 0 ? (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {sum.late_hours ? `${sum.late_hours}j ` : ''}{sum.late_minutes || 0}m
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0m</span>
                      )}
                    </td>

                    {/* Izin / Cuti */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {(sum.leave_days ?? 0) > 0 ? (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {sum.leave_days} hari
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>

                    {/* Alpha */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {(sum.absent_days ?? 0) > 0 ? (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md">
                          {sum.absent_days} hari
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>

                    {/* Persentase */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {getPercentageBadge(sum.percentage)}
                    </td>

                    {/* Status Approval */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getApprovalBadge(sum.status)}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve / Reject if pending */}
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickStatusChange(sum.id, 'Approved')}
                              disabled={updateMutation.isPending}
                              className="size-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15"
                              title="Setujui Rekap"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickStatusChange(sum.id, 'Rejected')}
                              disabled={updateMutation.isPending}
                              className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/15"
                              title="Tolak Rekap"
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
                            setSelectedSummary(sum);
                            setIsModalOpen(true);
                          }}
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit Rekap"
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({
                            id: sum.id,
                            name: `${sum.employee?.name || 'Karyawan'} (Periode ${sum.period || '-'})`
                          })}
                          className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          title="Hapus Rekap"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="size-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium">{t('Tidak ada data rekap kehadiran yang ditemukan.')}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedSummary(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-xs"
                      >
                        + Input Rekap Kehadiran
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Summary Modal (CRUD) */}
      {isModalOpen && (
        <AttendanceSummaryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSummary(null);
          }}
          onSave={handleSaveSummary}
          summary={selectedSummary}
          employees={employees}
        />
      )}

      {/* Confirmation Delete Dialog */}
      {deleteConfirm && (
        <ConfirmDeleteDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Hapus Rekap Kehadiran?"
          description={`Apakah Anda yakin ingin menghapus rekap kehadiran untuk ${deleteConfirm.name}? Tindakan ini tidak dapat dibatalkan.`}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

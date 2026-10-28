'use client';

import { useState } from 'react';
import { 
  useAttendances, 
  useEmployees, 
  useCreateAttendance, 
  useUpdateAttendance, 
  useUpdateAttendanceApproval, 
  useDeleteAttendance 
} from './queries';
import { 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { AttendanceModal, ConfirmDeleteDialog, ProofPreviewModal } from './components/modals';

export function DailyAttendance() {
  const { t, formatDate } = useLanguage();
  const { data: attendances, isLoading } = useAttendances();
  const { data: employees = [] } = useEmployees();

  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const approvalMutation = useUpdateAttendanceApproval();
  const deleteMutation = useDeleteAttendance();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sick_permit'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; date: string } | null>(null);

  // Quick filter logic
  const filtered = attendances?.filter((att: any) => {
    const matchesSearch = 
      att.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (att.notes && att.notes.toLowerCase().includes(search.toLowerCase())) ||
      att.status?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const approval = (att.approval_status || 'Approved').toLowerCase();
    const attStatus = (att.status || '').toLowerCase();

    if (statusFilter === 'pending') return approval === 'pending';
    if (statusFilter === 'approved') return approval === 'approved';
    if (statusFilter === 'rejected') return approval === 'rejected';
    if (statusFilter === 'sick_permit') return ['sick', 'permit', 'sakit', 'izin'].includes(attStatus);

    return true;
  });

  const pendingCount = attendances?.filter((a: any) => (a.approval_status || 'Approved').toLowerCase() === 'pending').length || 0;

  const handleSaveAttendance = async (formData: any) => {
    try {
      if (formData.id) {
        await updateMutation.mutateAsync({
          id: formData.id,
          data: formData
        });
        toast.success(t('Data presensi berhasil diperbarui'));
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t('Data presensi berhasil dicatat'));
      }
      setIsModalOpen(false);
      setSelectedAttendance(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menyimpan data presensi'));
    }
  };

  const handleQuickApproval = async (id: number, approval_status: string) => {
    try {
      await approvalMutation.mutateAsync({ id, approval_status });
      toast.success(
        approval_status === 'Approved'
          ? t('Presensi berhasil disetujui')
          : t('Presensi telah ditolak')
      );
    } catch (err: any) {
      toast.error(err.message || t('Gagal memperbarui status persetujuan'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success(t('Data presensi berhasil dihapus'));
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menghapus data presensi'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
      case 'Hadir':
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t('Hadir')}
          </span>
        );
      case 'Late':
      case 'Terlambat':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {t('Terlambat')}
          </span>
        );
      case 'Sick':
      case 'Sakit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="size-1.5 rounded-full bg-purple-500" />
            {t('Sakit')}
          </span>
        );
      case 'Permit':
      case 'Izin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="size-1.5 rounded-full bg-blue-500" />
            {t('Izin')}
          </span>
        );
      case 'Absent':
      case 'Alpha':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="size-1.5 rounded-full bg-rose-500" />
            {t('Alpha')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {t(status || '-')}
          </span>
        );
    }
  };

  const getApprovalBadge = (approvalStatus: string) => {
    const statusLower = (approvalStatus || 'Approved').toLowerCase();
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
              placeholder={`${t('Cari nama, status, atau catatan')}...`}
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
              onClick={() => setStatusFilter('sick_permit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'sick_permit'
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sakit / Izin
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
        
        {/* CRUD Action: Add Attendance */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button 
            onClick={() => {
              setSelectedAttendance(null);
              setIsModalOpen(true);
            }}
            className="gap-2 h-10 px-5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="size-4" />
            {t('Catat Kehadiran')}
          </Button>
        </div>
      </div>

      {/* Modern Attendance Table */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('Karyawan')}</th>
                <th className="px-6 py-4 font-semibold">{t('Tanggal')}</th>
                <th className="px-6 py-4 font-semibold">{t('Jam Masuk / Pulang')}</th>
                <th className="px-6 py-4 font-semibold">{t('Tipe Presensi')}</th>
                <th className="px-6 py-4 font-semibold">{t('Persetujuan HRD')}</th>
                <th className="px-6 py-4 font-semibold">{t('Surat / Bukti')}</th>
                <th className="px-6 py-4 font-semibold">{t('Catatan / Alasan')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('Aksi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-in fade-in duration-500">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered?.map((att: any) => {
                const approval = (att.approval_status || 'Approved').toLowerCase();
                const isPending = approval === 'pending';
                const hasAttachment = Boolean(att.attachment);

                return (
                  <tr key={att.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Karyawan */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {att.employee?.name ? att.employee.name.slice(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{att.employee?.name || 'Tanpa Nama'}</div>
                          <div className="text-xs text-muted-foreground">{att.employee?.department || att.employee?.position || 'Karyawan'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                      {formatDate(att.date)}
                    </td>

                    {/* Jam Masuk / Pulang */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {att.time_in || att.time_out ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>{att.time_in || '--:--'}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{att.time_out || '--:--'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Tipe Presensi */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(att.status)}
                    </td>

                    {/* Persetujuan HRD */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApprovalBadge(att.approval_status)}
                    </td>

                    {/* Surat / Bukti */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasAttachment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewAttachment({
                            url: att.attachment,
                            name: att.employee?.name || 'Karyawan',
                            date: formatDate(att.date)
                          })}
                          className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Eye className="size-3.5" />
                          Lihat Berkas
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Catatan / Alasan */}
                    <td className="px-6 py-4 max-w-xs text-xs text-muted-foreground truncate" title={att.notes}>
                      {att.notes || '-'}
                    </td>

                    {/* Aksi: Persetujuan, Edit, Hapus */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Cepat Setujui / Tolak jika Pending */}
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickApproval(att.id, 'Approved')}
                              disabled={approvalMutation.isPending}
                              className="size-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15"
                              title="Setujui Kehadiran / Izin"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickApproval(att.id, 'Rejected')}
                              disabled={approvalMutation.isPending}
                              className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/15"
                              title="Tolak Kehadiran / Izin"
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
                            setSelectedAttendance(att);
                            setIsModalOpen(true);
                          }}
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit Presensi"
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm({
                            id: att.id,
                            name: `${att.employee?.name || 'Karyawan'} (${formatDate(att.date)})`
                          })}
                          className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          title="Hapus Data"
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
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="size-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium">{t('Tidak ada data kehadiran yang ditemukan.')}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-xs"
                      >
                        + Catat Kehadiran Baru
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Form Modal (CRUD) */}
      {isModalOpen && (
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAttendance(null);
          }}
          onSave={handleSaveAttendance}
          attendance={selectedAttendance}
          employees={employees}
        />
      )}

      {/* Confirmation Delete Dialog */}
      {deleteConfirm && (
        <ConfirmDeleteDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Hapus Catatan Presensi?"
          description={`Apakah Anda yakin ingin menghapus data presensi untuk ${deleteConfirm.name}? Tindakan ini tidak dapat dibatalkan.`}
          isPending={deleteMutation.isPending}
        />
      )}

      {/* Attachment / Doctor's Note Preview Modal */}
      {previewAttachment && (
        <ProofPreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          proofUrl={previewAttachment.url}
          employeeName={previewAttachment.name}
          period={previewAttachment.date}
          title="Surat Dokter / Lampiran Izin"
          subtitle={`Dokumen pendukung kehadiran untuk ${previewAttachment.name} • ${previewAttachment.date}`}
        />
      )}
    </div>
  );
}

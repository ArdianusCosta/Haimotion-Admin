'use client';

import { useState } from 'react';
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
  CheckCircle, 
  CheckCircle2, 
  XCircle, 
  Pencil, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { LeaveRequestModal, ConfirmDeleteDialog, ProofPreviewModal } from './components/modals';

export function LeaveRequests() {
  const { t, formatDate } = useLanguage();
  const { data: leaves, isLoading } = useLeaves();
  const { data: employees = [] } = useEmployees();

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const deleteMutation = useDeleteLeaveRequest();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'sick' | 'permit'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

  const filteredLeaves = leaves?.filter((l: any) => {
    const matchesSearch = 
      l.employee?.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.type?.toLowerCase().includes(search.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const status = (l.status || 'Pending').toLowerCase();
    const type = (l.type || '').toLowerCase();

    if (statusFilter === 'pending') return status === 'pending';
    if (statusFilter === 'approved') return status === 'approved';
    if (statusFilter === 'rejected') return status === 'rejected';
    if (statusFilter === 'sick') return type.includes('sakit') || type.includes('sick');
    if (statusFilter === 'permit') return type.includes('izin') || type.includes('permit');

    return true;
  });

  const pendingCount = leaves?.filter((l: any) => (l.status || 'Pending').toLowerCase() === 'pending').length || 0;

  const handleSaveLeave = async (formData: any) => {
    try {
      if (formData.id) {
        await updateMutation.mutateAsync({
          id: formData.id,
          data: formData
        });
        toast.success(t('Permohonan izin / sakit berhasil diperbarui'));
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t('Permohonan izin / sakit berhasil diajukan'));
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
          ? t('Permohonan izin / sakit telah disetujui')
          : t('Permohonan izin / sakit telah ditolak')
      );
    } catch (err: any) {
      toast.error(err.message || t('Gagal mengubah status'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      toast.success(t('Permohonan izin / sakit berhasil dihapus'));
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || t('Gagal menghapus permohonan'));
    }
  };

  const calculateDays = (start: string | Date, end: string | Date) => {
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 1;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const tLower = (type || '').toLowerCase();
    if (tLower.includes('sakit') || tLower.includes('sick')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
          <span>🏥</span>
          {type}
        </span>
      );
    }
    if (tLower.includes('izin') || tLower.includes('permit')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
          <span>📄</span>
          {type}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
        <span>🏖️</span>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const sLower = (status || 'Pending').toLowerCase();
    if (sLower === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="size-3.5" />
          {t('Disetujui')}
        </span>
      );
    }
    if (sLower === 'rejected') {
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
              placeholder={`${t('Cari nama, tipe, atau alasan')}...`}
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
              onClick={() => setStatusFilter('sick')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'sick'
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sakit
            </button>
            <button
              onClick={() => setStatusFilter('permit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'permit'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Izin
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
        
        {/* CRUD Action: Request Leave / Sakit / Izin */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button 
            onClick={() => {
              setSelectedLeave(null);
              setIsModalOpen(true);
            }}
            className="gap-2 h-10 px-5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="size-4" />
            {t('Ajukan Izin / Sakit / Cuti')}
          </Button>
        </div>
      </div>

      {/* Modern Leave Requests Table */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('Karyawan')}</th>
                <th className="px-6 py-4 font-semibold">{t('Jenis Permohonan')}</th>
                <th className="px-6 py-4 font-semibold">{t('Periode & Durasi')}</th>
                <th className="px-6 py-4 font-semibold">{t('Alasan / Keterangan')}</th>
                <th className="px-6 py-4 font-semibold">{t('Surat / Dokumen')}</th>
                <th className="px-6 py-4 font-semibold">{t('Status Persetujuan')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('Aksi')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-in fade-in duration-500">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeaves?.map((leave: any) => {
                const isPending = (leave.status || 'Pending').toLowerCase() === 'pending';
                const totalDays = calculateDays(leave.start_date, leave.end_date);
                const hasAttachment = Boolean(leave.attachment);

                return (
                  <tr key={leave.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Karyawan */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {leave.employee?.name ? leave.employee.name.slice(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{leave.employee?.name || 'Tanpa Nama'}</div>
                          <div className="text-xs text-muted-foreground">{leave.employee?.department || leave.employee?.position || 'Karyawan'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Jenis Permohonan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLeaveTypeBadge(leave.type)}
                    </td>

                    {/* Durasi */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span>{formatDate(leave.start_date)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatDate(leave.end_date)}</span>
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          Total {totalDays} hari kerja
                        </div>
                      </div>
                    </td>

                    {/* Alasan */}
                    <td className="px-6 py-4 max-w-[240px] truncate text-xs text-foreground font-normal" title={leave.reason}>
                      {leave.reason || '-'}
                    </td>

                    {/* Surat / Dokumen */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasAttachment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewAttachment({
                            url: leave.attachment,
                            name: leave.employee?.name || 'Karyawan',
                            type: leave.type
                          })}
                          className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Eye className="size-3.5" />
                          Lihat Surat
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Status Persetujuan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(leave.status)}
                    </td>

                    {/* Aksi: Persetujuan, Edit, Hapus */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Cepat Setujui / Tolak */}
                        {isPending && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatus(leave.id, 'Approved')}
                              disabled={updateStatus.isPending}
                              className="size-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15"
                              title={t('Setujui Permohonan')}
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickStatus(leave.id, 'Rejected')}
                              disabled={updateStatus.isPending}
                              className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/15"
                              title={t('Tolak Permohonan')}
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
                          title="Edit Pengajuan"
                        >
                          <Pencil className="size-4" />
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
                          <Trash2 className="size-4" />
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
                      <AlertCircle className="size-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium">{t('Tidak ada data permohonan izin/cuti.')}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLeave(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-2 text-xs"
                      >
                        + Ajukan Permohonan Baru
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Request Form Modal (CRUD) */}
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

      {/* Confirmation Delete Dialog */}
      {deleteConfirm && (
        <ConfirmDeleteDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Hapus Permohonan Izin / Sakit?"
          description={`Apakah Anda yakin ingin menghapus permohonan untuk ${deleteConfirm.name}? Tindakan ini tidak dapat dibatalkan.`}
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
          title={`Surat Dokter / Lampiran ${previewAttachment.type}`}
          subtitle={`Dokumen pendukung untuk ${previewAttachment.name}`}
        />
      )}
    </div>
  );
}

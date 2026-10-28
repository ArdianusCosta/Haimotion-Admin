import { useState } from 'react';
import { usePayrolls, useCreatePayroll, useUpdatePayroll, useDeletePayroll, useEmployees } from './queries';
import { exportPayrollsCsv } from '@/app/actions/hr';
import { HRPageHeader } from './components';
import { PayrollModal, UpdatePayrollModal, ProofPreviewModal } from './components/modals';
import { Search, Download, Plus, Edit3, Trash2, Paperclip, CheckCircle2, Clock, Eye, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

export function PayrollPage() {
  const { t } = useLanguage();
  const { data: payrolls, isLoading } = usePayrolls();
  const { data: employees } = useEmployees();
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const deletePayroll = useDeletePayroll();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<any | null>(null);
  const [previewProofPayroll, setPreviewProofPayroll] = useState<any | null>(null);

  const handleSave = (data: any) => {
    createPayroll.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        toast.success(t('Payroll generated successfully!'));
      }
    });
  };

  const handleUpdate = (data: any) => {
    updatePayroll.mutate(data, {
      onSuccess: () => {
        setEditingPayroll(null);
        toast.success('Status payroll berhasil diperbarui!');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Gagal memperbarui status payroll');
      }
    });
  };

  const handleDelete = (payroll: any) => {
    if (confirm(`Apakah kamu yakin ingin menghapus payroll untuk ${payroll.employee?.name} periode ${payroll.period}?`)) {
      deletePayroll.mutate(payroll.id, {
        onSuccess: () => {
          toast.success('Data payroll berhasil dihapus.');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Gagal menghapus data payroll');
        }
      });
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportPayrollsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('Payroll data exported successfully!'));
    } catch (e) {
      toast.error(t('Failed to export payroll data.'));
    }
  };

  const filteredPayrolls = payrolls?.filter((p: any) => 
    p.employee?.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.period.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('Paid')}
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3 mr-1 animate-spin" /> {t('Processing')}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3 mr-1" /> {t('Cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" /> {t('Pending')}
          </span>
        );
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="w-full space-y-6">
        <HRPageHeader 
          title={t('Payroll')} 
          description={t('View and manage employee salaries, allowances, and deductions.')}
        >
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> {t('Export')} CSV
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="ml-2"
            >
              <Plus className="mr-2 h-4 w-4" /> {t('Generate Payroll')}
            </Button>
          </>
        </HRPageHeader>

        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`${t('Search')} ${t('Period').toLowerCase()} / ${t('Name').toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('Name')}</th>
                    <th className="px-6 py-4 font-medium">{t('Period')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Basic Salary')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Allowance')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Deduction')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Net Pay')}</th>
                    <th className="px-6 py-4 font-medium">{t('Status')}</th>
                    <th className="px-6 py-4 font-medium text-center">{t('Bukti / Slip')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Aksi')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-in fade-in duration-500">
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-28 ml-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32 ml-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredPayrolls?.map((payroll: any) => (
                    <tr key={payroll.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{payroll.employee?.name}</div>
                        {payroll.notes && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px] truncate" title={payroll.notes}>
                            📝 {payroll.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>{payroll.period}</div>
                        {payroll.payment_date && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Bayar: {new Date(payroll.payment_date).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(payroll.basic_salary)}</td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">+{formatCurrency(payroll.allowance)}</td>
                      <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">-{formatCurrency(payroll.deduction)}</td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">{formatCurrency(payroll.net_pay)}</td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(payroll.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {payroll.payment_proof ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                            onClick={() => setPreviewProofPayroll(payroll)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Bukti
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => setEditingPayroll(payroll)}
                            title="Update Status / Upload Bukti"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Update
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDelete(payroll)}
                            title="Hapus Data Payroll"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayrolls?.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                        {t('No data found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* Modal Generate Payroll Baru */}
      <PayrollModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        employees={employees || []}
      />

      {/* Modal Update Status & Upload Bukti Pembayaran */}
      <UpdatePayrollModal
        isOpen={!!editingPayroll}
        onClose={() => setEditingPayroll(null)}
        onSave={handleUpdate}
        payroll={editingPayroll}
      />

      {/* Modal Preview Bukti Transfer */}
      <ProofPreviewModal
        isOpen={!!previewProofPayroll}
        onClose={() => setPreviewProofPayroll(null)}
        proofUrl={previewProofPayroll?.payment_proof || null}
        employeeName={previewProofPayroll?.employee?.name}
        period={previewProofPayroll?.period}
      />
    </div>
  );
}

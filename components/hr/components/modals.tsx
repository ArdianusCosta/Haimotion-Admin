import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import { Upload, FileText, CheckCircle, ExternalLink, Eye, Loader2, X, Trash2, CreditCard, Wallet, Calendar, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';


export function EmployeeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  employee 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  employee?: any | null;
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    role: '',
    department: 'Engineering',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0,
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        department: 'Engineering',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        salary: 0,
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? t('Edit Employee') : t('Add New Employee')}</DialogTitle>
          <DialogDescription>
            {employee ? t('Update employee details here.') : t('Enter the details of the new employee.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('Name')}</label>
            <Input 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('Email')}</label>
            <Input 
              required type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('Role')}</label>
              <Input 
                required
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('Department')}</label>
              <select 
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {t('Save changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDestructive = true
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDestructive?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button 
            type="button" 
            variant={isDestructive ? "destructive" : "default"}
            onClick={() => { onConfirm(); onClose(); }} 
          >
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PayrollModal({ 
  isOpen, 
  onClose, 
  onSave, 
  employees 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  employees: any[];
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<any>({
    employeeId: '',
    period: new Date().toISOString().slice(0, 7),
    basicSalary: 0,
    allowance: 0,
    deduction: 0,
    status: 'Pending',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      employeeId: parseInt(formData.employeeId, 10),
      basicSalary: parseFloat(formData.basicSalary.toString()),
      allowance: parseFloat(formData.allowance.toString()),
      deduction: parseFloat(formData.deduction.toString()),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Generate Payroll')}</DialogTitle>
          <DialogDescription>{t('Create a new payroll record for an employee.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('Name')}</label>
            <select 
              required
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
            >
              <option value="" disabled>{t('Select Employee')}</option>
              {employees?.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('Period')} (YYYY-MM)</label>
            <Input 
              required type="month"
              value={formData.period}
              onChange={e => setFormData({ ...formData, period: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('Basic Salary')} (IDR)</label>
              <Input required type="number" min="0"
                value={formData.basicSalary}
                onChange={e => setFormData({ ...formData, basicSalary: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t('Allowance')} (IDR)</label>
              <Input type="number" min="0"
                value={formData.allowance}
                onChange={e => setFormData({ ...formData, allowance: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('Deduction')} (IDR)</label>
            <Input type="number" min="0"
              value={formData.deduction}
              onChange={e => setFormData({ ...formData, deduction: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t('Generate Payroll')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UpdatePayrollModal({ 
  isOpen, 
  onClose, 
  onSave, 
  payroll 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  payroll: any;
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('Pending');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [syncToFinance, setSyncToFinance] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showProofPreview, setShowProofPreview] = useState(false);

  useEffect(() => {
    if (payroll) {
      setStatus(payroll.status || 'Pending');
      setPaymentDate(
        payroll.payment_date 
          ? new Date(payroll.payment_date).toISOString().slice(0, 10) 
          : new Date().toISOString().slice(0, 10)
      );
      setPaymentProof(payroll.payment_proof || null);
      setNotes(payroll.notes || '');
      setSyncToFinance(payroll.status !== 'Paid');
    }
  }, [payroll]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 8MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPaymentProof(data.url);
        toast.success('Bukti pembayaran berhasil diunggah!');
      } else {
        toast.error('Gagal mengunggah file bukti transfer.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat upload bukti transfer.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: payroll.id,
      status,
      paymentDate: status === 'Paid' ? (paymentDate || new Date().toISOString().slice(0, 10)) : null,
      paymentProof,
      notes,
      syncToFinance: status === 'Paid' ? syncToFinance : false,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (!payroll) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader className="flex flex-row items-center gap-3.5 space-y-0 border-b pb-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <CreditCard className="size-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t('Update Status Pembayaran Gaji')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {payroll.employee?.name} {payroll.employee?.position ? `(${payroll.employee.position})` : ''} • Periode <span className="font-semibold text-foreground">{payroll.period}</span>
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Info Card Ringkasan Gaji (4 Card Grid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-2">
            <div className="bg-muted/40 border border-border/80 rounded-xl p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Gaji Pokok</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(payroll.basic_salary)}</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Tunjangan</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatCurrency(payroll.allowance)}</p>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Potongan</p>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">-{formatCurrency(payroll.deduction)}</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
              <p className="text-[11px] font-medium text-primary">Gaji Bersih (Net)</p>
              <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(payroll.net_pay)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: Status & Form Meta */}
              <div className="space-y-3.5">
                {/* Pilih Status */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">{t('Status Pembayaran')}</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-foreground"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Pending">🟡 Pending (Menunggu Pembayaran)</option>
                    <option value="Processing">🔵 Processing (Sedang Diproses)</option>
                    <option value="Paid">🟢 Paid (Sudah Ditransfer / Lunas)</option>
                    <option value="Cancelled">🔴 Cancelled (Dibatalkan)</option>
                  </select>
                </div>

                {/* Tanggal Pembayaran jika Paid */}
                {status === 'Paid' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="size-4 text-muted-foreground" />
                      {t('Tanggal Transfer / Pembayaran')}
                    </label>
                    <Input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="h-10 bg-background"
                    />
                  </div>
                )}

                {/* Catatan */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">{t('Catatan (Opsional)')}</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Transfer via BCA An. Dea ref: 8934"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>

                {/* Checkbox Otomatis Catat ke Pengeluaran */}
                {status === 'Paid' && (
                  <div className="flex items-start space-x-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in duration-200">
                    <input
                      type="checkbox"
                      id="syncToFinance"
                      checked={syncToFinance}
                      onChange={e => setSyncToFinance(e.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="syncToFinance" className="text-xs cursor-pointer select-none space-y-0.5">
                      <span className="font-semibold block text-foreground">Otomatis Catat ke Pengeluaran (Finance)</span>
                      <span className="text-muted-foreground block text-[11px] leading-relaxed">
                        Nominal {formatCurrency(payroll.net_pay)} akan langsung dicatat sebagai pengeluaran kas di modul Finance.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Upload Bukti Transfer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">{t('Bukti Transfer / Slip Gaji')}</label>
                  {paymentProof && (
                    <button
                      type="button"
                      onClick={() => setPaymentProof(null)}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:underline flex items-center font-medium"
                    >
                      <Trash2 className="size-3.5 mr-1" /> Hapus Bukti
                    </button>
                  )}
                </div>

                {paymentProof ? (
                  <div className="border border-border/80 rounded-xl p-3.5 bg-card/60 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="size-14 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {paymentProof.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="size-8 text-primary" />
                        ) : (
                          <img
                            src={paymentProof}
                            alt="Bukti Preview"
                            className="size-full object-cover"
                            onError={(e) => {
                              // Fallback jika image gagal dimuat
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold text-foreground truncate">Bukti Transfer Terlampir</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {paymentProof.toLowerCase().endsWith('.pdf') ? 'Dokumen PDF' : 'File Gambar Bukti'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProofPreview(true)}
                        className="flex-1 h-8 text-xs font-medium"
                      >
                        <Eye className="size-3.5 mr-1.5 text-primary" /> Lihat Bukti Lengkap
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 text-xs text-muted-foreground"
                      >
                        <a href={paymentProof} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 hover:bg-muted/30 transition-all text-center cursor-pointer min-h-[160px] flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="size-7 animate-spin text-primary" />
                        <p className="text-xs font-medium text-foreground">Mengunggah file ke server...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Upload className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Klik untuk upload bukti transfer</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WEBP, atau PDF (Maks. 8MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t pt-4 mt-6 gap-2 sm:gap-0">
              <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5">
                {t('Batal')}
              </Button>
              <Button type="submit" className="h-10 px-6 font-semibold shadow-sm">
                {t('Simpan Perubahan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* In-Dialog Proof Preview Modal */}
      {showProofPreview && paymentProof && (
        <ProofPreviewModal
          isOpen={showProofPreview}
          onClose={() => setShowProofPreview(false)}
          proofUrl={paymentProof}
          employeeName={payroll.employee?.name}
          period={payroll.period}
        />
      )}
    </>
  );
}

export function ProofPreviewModal({
  isOpen,
  onClose,
  proofUrl,
  employeeName,
  period
}: {
  isOpen: boolean;
  onClose: () => void;
  proofUrl: string | null;
  employeeName?: string;
  period?: string;
}) {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  if (!proofUrl) return null;

  const isPdf = proofUrl.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-6 md:p-8 bg-card border-border shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t('Bukti Pembayaran Gaji')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {employeeName || 'Karyawan'} • Periode {period || '-'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-muted/20 dark:bg-zinc-950/40 rounded-2xl border border-border/80 p-4 min-h-[420px] max-h-[62vh]">
          {isPdf ? (
            <iframe src={proofUrl} className="w-full h-[520px] rounded-xl border border-border" />
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <AlertCircle className="size-12 text-rose-500/80" />
              <div>
                <p className="text-sm font-semibold text-foreground">Gagal memuat pratinjau gambar</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Format gambar atau tautan mungkin tidak dapat dibuka langsung di dalam browser.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5 mr-1.5" /> Buka Tautan di Tab Baru
                </a>
              </Button>
            </div>
          ) : (
            <img 
              src={proofUrl} 
              alt="Bukti Transfer" 
              onError={() => setImageError(true)}
              className="max-h-[520px] max-w-full w-auto object-contain rounded-xl shadow-lg border border-border/40" 
            />
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 border-t pt-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild size="sm" className="h-9">
              <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-3.5" /> Buka Tab Baru
              </a>
            </Button>
            <Button variant="outline" asChild size="sm" className="h-9">
              <a href={proofUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 size-3.5" /> Unduh
              </a>
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose} size="sm" className="h-9 px-5 w-full sm:w-auto font-medium">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
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
import { Upload, FileText, CheckCircle, ExternalLink, Eye, Loader2, X, Trash2 } from 'lucide-react';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('Update Status Pembayaran Gaji')}</DialogTitle>
          <DialogDescription>
            {payroll.employee?.name} • Periode {payroll.period}
          </DialogDescription>
        </DialogHeader>

        {/* Info Card Ringkasan Gaji */}
        <div className="bg-muted/40 border rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gaji Pokok:</span>
            <span>{formatCurrency(payroll.basic_salary)}</span>
          </div>
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Tunjangan:</span>
            <span>+{formatCurrency(payroll.allowance)}</span>
          </div>
          <div className="flex justify-between text-red-600 dark:text-red-400">
            <span>Potongan:</span>
            <span>-{formatCurrency(payroll.deduction)}</span>
          </div>
          <div className="border-t pt-1 flex justify-between font-bold text-sm text-foreground">
            <span>Total Gaji Bersih (Net Pay):</span>
            <span>{formatCurrency(payroll.net_pay)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Pilih Status */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{t('Status Pembayaran')}</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="Pending" className="text-amber-600">🟡 Pending (Menunggu Pembayaran)</option>
              <option value="Processing" className="text-blue-600">🔵 Processing (Sedang Diproses)</option>
              <option value="Paid" className="text-green-600">🟢 Paid (Sudah Ditransfer / Lunas)</option>
              <option value="Cancelled" className="text-red-600">🔴 Cancelled (Dibatalkan)</option>
            </select>
          </div>

          {/* Tanggal Pembayaran jika Paid */}
          {status === 'Paid' && (
            <div className="grid gap-1.5 animate-in fade-in duration-200">
              <label className="text-sm font-medium">{t('Tanggal Transfer / Pembayaran')}</label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>
          )}

          {/* Upload Bukti Pembayaran */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>{t('Bukti Transfer / Pembayaran')}</span>
              {paymentProof && (
                <button
                  type="button"
                  onClick={() => setPaymentProof(null)}
                  className="text-xs text-red-500 hover:underline flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Hapus Bukti
                </button>
              )}
            </label>

            {paymentProof ? (
              <div className="flex items-center space-x-3 p-2.5 rounded-lg border bg-muted/20">
                {paymentProof.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-8 h-8 text-primary" />
                ) : (
                  <img src={paymentProof} alt="Preview" className="w-12 h-12 object-cover rounded border" />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-foreground truncate">Bukti Transfer Terlampir</p>
                  <a
                    href={paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center mt-0.5"
                  >
                    <Eye className="w-3 h-3 mr-1" /> Lihat Bukti
                  </a>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-input rounded-lg p-3 hover:bg-muted/30 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Mengunggah file...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">Klik untuk upload bukti struk / slip transfer</p>
                      <p className="text-[10px] text-muted-foreground">Mendukung JPG, PNG, PDF (Maks. 8MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{t('Catatan (Opsional)')}</label>
            <Input
              type="text"
              placeholder="Contoh: Transfer via BCA An. Dea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Checkbox Otomatis Catat ke Pengeluaran */}
          {status === 'Paid' && (
            <div className="flex items-start space-x-2.5 p-3 rounded-lg border bg-primary/5 border-primary/20 animate-in fade-in duration-200">
              <input
                type="checkbox"
                id="syncToFinance"
                checked={syncToFinance}
                onChange={e => setSyncToFinance(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="syncToFinance" className="text-xs cursor-pointer select-none">
                <span className="font-semibold block text-foreground">Otomatis Catat ke Menu Pengeluaran (Finance)</span>
                <span className="text-muted-foreground">
                  Nominal {formatCurrency(payroll.net_pay)} akan langsung dicatat sebagai pengeluaran kas di modul Finance.
                </span>
              </label>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              {t('Batal')}
            </Button>
            <Button type="submit">
              {t('Simpan Perubahan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  if (!proofUrl) return null;

  const isPdf = proofUrl.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>{t('Bukti Pembayaran Gaji')}</DialogTitle>
          <DialogDescription>
            {employeeName} • Periode {period}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto my-3 flex items-center justify-center bg-muted/30 rounded-lg p-2 min-h-[280px]">
          {isPdf ? (
            <iframe src={proofUrl} className="w-full h-[400px] rounded border" />
          ) : (
            <img 
              src={proofUrl} 
              alt="Bukti Transfer" 
              className="max-h-[400px] w-auto object-contain rounded shadow-sm" 
            />
          )}
        </div>
        <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
          <Button variant="outline" asChild size="sm">
            <a href={proofUrl} target="_blank" rel="noopener noreferrer" download>
              <ExternalLink className="mr-2 h-4 w-4" /> Buka Tab Baru / Unduh
            </a>
          </Button>
          <Button variant="secondary" onClick={onClose} size="sm">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

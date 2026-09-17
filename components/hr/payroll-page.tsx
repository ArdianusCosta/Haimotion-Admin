import { useState } from 'react';
import { usePayrolls, useCreatePayroll, useEmployees } from './queries';
import { exportPayrollsCsv } from '@/app/actions/hr';
import { HRPageHeader } from './components';
import { PayrollModal } from './components/modals';
import { Search, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = (data: any) => {
    createPayroll.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        toast.success(t('Payroll generated successfully!'));
      }
    });
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
    p.period.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-6">
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
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t('Loading')}</div>
          ) : (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPayrolls?.map((payroll: any) => (
                    <tr key={payroll.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{payroll.employee?.name}</td>
                      <td className="px-6 py-4">{payroll.period}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(payroll.basic_salary)}</td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">+{formatCurrency(payroll.allowance)}</td>
                      <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">-{formatCurrency(payroll.deduction)}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(payroll.net_pay)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${payroll.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {payroll.status === 'Paid' ? t('Paid') : t('Pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPayrolls?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        {t('No data found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PayrollModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        employees={employees || []}
      />
    </div>
  );
}

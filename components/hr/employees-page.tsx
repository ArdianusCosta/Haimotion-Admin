'use client'

import { useState } from 'react';
import { useEmployees, useUpdateEmployee } from './queries';
import { HRPageHeader, EmployeeStatusBadge } from './components';
import { EmployeeModal } from './components/modals';
import { Search, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';

export function EmployeesPage() {
  const { t } = useLanguage();
  const { data: employees, isLoading } = useEmployees();
  const updateEmp = useUpdateEmployee();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  const handleSave = (data: any) => {
    if (selectedEmp) {
      updateEmp.mutate({ id: selectedEmp.id, data }, {
        onSuccess: () => {
          toast.success(t('Employee updated successfully!'));
          setIsModalOpen(false);
        }
      });
    }
  };

  const filteredEmployees = employees?.filter((e: any) => 
    e.name?.toLowerCase().includes(search.toLowerCase()) || 
    e.role?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <HRPageHeader 
          title={t('Employees')} 
          description={t('View your organization\'s members. To add or remove users, use User Management.')}
        />

        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`${t('Search')} ${t('Employees').toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>{t('Employee list is sourced from the Users database.')}</span>
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
                    <th className="px-6 py-4 font-medium">{t('Role')}</th>
                    <th className="px-6 py-4 font-medium">{t('Department')}</th>
                    <th className="px-6 py-4 font-medium">{t('Status')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees?.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4">{emp.role}</td>
                      <td className="px-6 py-4">{emp.department}</td>
                      <td className="px-6 py-4">
                        <EmployeeStatusBadge status={emp.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => { setSelectedEmp(emp); setIsModalOpen(true); }}
                          variant="ghost" size="icon" className="h-8 w-8"
                          title={t('Edit')}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
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

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        employee={selectedEmp} 
      />
    </div>
  );
}

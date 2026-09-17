import { useState } from 'react';
import { useLeaves, useUpdateLeaveStatus } from './queries';
import { HRPageHeader, LeaveStatusBadge } from './components';
import { ConfirmActionModal } from './components/modals';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';

export function LeaveRequests() {
  const { t, formatDate } = useLanguage();
  const { data: leaves, isLoading } = useLeaves();
  const updateLeave = useUpdateLeaveStatus();
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: number, status: string } | null>(null);

  const filteredLeaves = leaves?.filter((l: any) => 
    l.employee?.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`${t('Search')} ${t('Name').toLowerCase()} / ${t('Leave Requests').toLowerCase()}...`}
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
                    <th className="px-6 py-4 font-medium">{t('Leave Type')}</th>
                    <th className="px-6 py-4 font-medium">{t('Duration')}</th>
                    <th className="px-6 py-4 font-medium">{t('Reason')}</th>
                    <th className="px-6 py-4 font-medium">{t('Status')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeaves?.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{leave.employee?.name}</td>
                      <td className="px-6 py-4">{leave.type}</td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="px-6 py-4">
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {leave.status === 'Pending' && (
                          <>
                            <Button 
                              onClick={() => setConfirmAction({ id: leave.id, status: 'Approved' })}
                              variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                              title={t('Approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => setConfirmAction({ id: leave.id, status: 'Rejected' })}
                              variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              title={t('Reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLeaves?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
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

      <ConfirmActionModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            updateLeave.mutate({ id: confirmAction.id, status: confirmAction.status }, {
              onSuccess: () => toast.success(`${t('Leave Requests')} ${confirmAction.status === 'Approved' ? t('approved') : t('rejected')}!`)
            });
          }
        }}
        title={`${confirmAction?.status === 'Approved' ? t('Approve') : t('Reject')} ${t('Leave Requests')}`}
        description={t('Are you sure you want to update this leave request?')}
        isDestructive={confirmAction?.status === 'Rejected'}
      />
    </>
  );
}

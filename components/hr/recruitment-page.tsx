import { useState } from 'react';
import { useCandidates } from './queries';
import { HRPageHeader } from './components';
import { Search, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';

export function RecruitmentPage() {
  const { t, formatDate } = useLanguage();
  const { data: candidates, isLoading } = useCandidates();
  const [search, setSearch] = useState('');

  const filteredCandidates = candidates?.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.role_applied.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'Screening': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Interview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Offered': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Hired': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <HRPageHeader 
          title={t('Recruitment')} 
          description={t('Applicant Tracking System to manage active job applications.')}
        />

        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`${t('Search')} ${t('Recruitment').toLowerCase()}...`}
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
                    <th className="px-6 py-4 font-medium">{t('Candidate')}</th>
                    <th className="px-6 py-4 font-medium">{t('Role Applied')}</th>
                    <th className="px-6 py-4 font-medium">{t('Applied Date')}</th>
                    <th className="px-6 py-4 font-medium">{t('Rating')}</th>
                    <th className="px-6 py-4 font-medium">{t('Status')}</th>
                    <th className="px-6 py-4 font-medium text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCandidates?.map((candidate: any) => (
                    <tr key={candidate.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </td>
                      <td className="px-6 py-4">{candidate.role_applied}</td>
                      <td className="px-6 py-4">{formatDate(candidate.applied_date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= candidate.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          title={t('View Profile')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCandidates?.length === 0 && (
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
    </div>
  );
}

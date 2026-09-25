import { useQuery } from '@tanstack/react-query';
import { ActivityLog } from '@/types/activity-log';

export function useActivityLogs() {
  return useQuery<ActivityLog[]>({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await fetch('/api/activity-log');
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      return res.json();
    }
  });
}

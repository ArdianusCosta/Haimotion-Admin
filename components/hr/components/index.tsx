import { LeaveStatus, EmploymentStatus } from '../types';

export function HRPageHeader({ title, description, children }: { title: string, description: string, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function EmployeeStatusBadge({ status }: { status: EmploymentStatus }) {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  if (status === 'Active') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'On Leave') colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (status === 'Terminated') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  if (status === 'Approved') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'Pending') colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (status === 'Rejected') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

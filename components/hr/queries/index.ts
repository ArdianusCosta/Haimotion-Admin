import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHrOverview,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getLeaves,
  updateLeaveStatus,
  createLeaveRequest,
  getAttendances,
  importAttendances,
  getPayrolls,
  createPayroll,
  getCandidates,
  updateCandidateStatus,
  createCandidate,
  getAttendanceSummaries,
  importAttendanceSummaries
} from '@/app/actions/hr';

// Employee Queries & Mutations
export function useEmployees(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['hr-employees', filters],
    queryFn: () => getEmployees(filters),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

// Leaves / Attendance Queries & Mutations
export function useLeaves() {
  return useQuery({
    queryKey: ['hr-leaves'],
    queryFn: () => getLeaves(),
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateLeaveStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

// Attendance Queries & Mutations
export function useAttendances() {
  return useQuery({
    queryKey: ['hr-attendances'],
    queryFn: () => getAttendances(),
  });
}

export function useImportAttendances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => importAttendances(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendances'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

export function useAttendanceSummaries() {
  return useQuery({
    queryKey: ['hr-attendance-summaries'],
    queryFn: () => getAttendanceSummaries(),
  });
}

export function useImportAttendanceSummaries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => importAttendanceSummaries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

// Payroll Queries & Mutations
export function usePayrolls() {
  return useQuery({
    queryKey: ['hr-payrolls'],
    queryFn: () => getPayrolls(),
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
  });
}

// ATS / Recruitment Queries & Mutations
export function useCandidates(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['hr-candidates', filters],
    queryFn: () => getCandidates(filters),
  });
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateCandidateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['hr-overview'] });
    },
  });
}

// Overview Queries
export function useHrOverview() {
  return useQuery({
    queryKey: ['hr-overview'],
    queryFn: () => getHrOverview(),
  });
}

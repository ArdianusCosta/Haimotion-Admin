export type Department = 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'Human Resources' | 'Finance';
export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated';
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Maternity/Paternity';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type CandidateStatus = 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department;
  status: EmploymentStatus;
  joinDate: string;
  salary: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string; // denormalized for easy display
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. "2023-10"
  basicSalary: number;
  allowance: number;
  deduction: number;
  netPay: number;
  status: 'Paid' | 'Pending';
  paymentDate?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  appliedDate: string;
  status: CandidateStatus;
  rating: number; // 1-5
}

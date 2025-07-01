export interface User {
  uid: string;
  email: string;
  role: 'globalAdmin' | 'admin' | 'operator';
  assignedBranches?: string[];
}

export interface Branch {
  id: string;
  name: string;
  color: string;
  type: 'hotel' | 'cafe';
}

export interface SalesEntry {
  id: string;
  branchId: string;
  date: string;
  cashAmount: number;
  onlineAmount: number;
  pendingAmount: number;
  total: number;
  userId: string;
  userEmail: string;
  timestamp: Date;
}

export interface ExpenseEntry {
  id: string;
  branchId: string;
  date: string;
  cashAmount: number;
  onlineAmount: number;
  pendingAmount: number;
  total: number;
  description?: string;
  userId: string;
  userEmail: string;
  timestamp: Date;
}

export interface Vendor {
  id: string;
  branchId: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  createdAt: Date;
}

export interface VendorPayment {
  id: string;
  branchId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
  description?: string;
  paymentMethod?: 'cash' | 'online';
  userId: string;
  timestamp: Date;
}

export interface MaintenanceLog {
  id: string;
  branchId: string;
  roomOrArea: string;
  issue: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  reportedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}
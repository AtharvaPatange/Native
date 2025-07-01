import { Branch } from '@/types';

export const BRANCHES: Branch[] = [
  {
    id: 'hotel-orient-elite',
    name: 'Hotel Orient Elite',
    color: '#1E40AF',
    type: 'hotel'
  },
  {
    id: 'hotel-ojas',
    name: 'Hotel Ojas',
    color: '#7C3AED',
    type: 'hotel'
  },
  {
    id: 'catena-cafe',
    name: 'Catena Cafe',
    color: '#059669',
    type: 'cafe'
  }
];

export const getBranchById = (id: string): Branch | undefined => {
  return BRANCHES.find(branch => branch.id === id);
};

export const getBranchColor = (branchId: string): string => {
  const branch = getBranchById(branchId);
  return branch?.color || '#6B7280';
};
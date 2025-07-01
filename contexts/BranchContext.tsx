import React, { createContext, useContext, useState } from 'react';
import { Branch } from '@/types';

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const value = {
    selectedBranch,
    setSelectedBranch
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
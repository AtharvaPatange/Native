import { auth, db } from '@/constants/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type BranchId = 'orientElite' | 'ojas' | 'catenaCafe';
export type Role = 'globalAdmin' | 'admin' | 'operator' | null;

interface AuthContextProps {
  user: User | null;
  claims: any;
  branch: BranchId | null;
  setBranch: (branch: BranchId | null) => void;
  loading: boolean;
  userRole: Role;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  claims: null,
  branch: null,
  setBranch: () => {},
  loading: true,
  userRole: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        // Get custom claims from user token
        const token = await firebaseUser.getIdTokenResult(true);
        setClaims(token.claims);
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || null);
        } else {
          setUserRole(null);
        }
      } else {
        setClaims(null);
        setUserRole(null);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, claims, branch, setBranch, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}; 
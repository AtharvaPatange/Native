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
  error: string | null;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  claims: null,
  branch: null,
  setBranch: () => {},
  loading: true,
  userRole: null,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
      setUser(firebaseUser);
        setError(null);
        
      if (firebaseUser) {
        // Get custom claims from user token
        const token = await firebaseUser.getIdTokenResult(true);
        setClaims(token.claims);
          
        // Fetch user role from Firestore
          try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData?.role || null;
              setUserRole(role);
            } else {
              setUserRole(null);
            }
          } catch (firestoreError) {
            console.error('Error fetching user role:', firestoreError);
            setUserRole(null);
            setError('Failed to fetch user role');
          }
        } else {
          setClaims(null);
          setUserRole(null);
        }
      } catch (authError) {
        console.error('Auth state change error:', authError);
        setError('Authentication error occurred');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, claims, branch, setBranch, loading, userRole, error }}>
      {children}
    </AuthContext.Provider>
  );
}; 
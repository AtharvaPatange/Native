import { auth, db } from '@/constants/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  logout: (callback?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  claims: null,
  branch: null,
  setBranch: () => {},
  loading: true,
  userRole: null,
  error: null,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role>(null);
  const [error, setError] = useState<string | null>(null);

  // Check stored tokens on startup
  const checkStoredTokens = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      console.log('AuthContext - Stored token exists:', !!storedToken);
      console.log('AuthContext - Stored user ID:', storedUserId);
    } catch (error) {
      console.error('Error checking stored tokens:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext - Setting up auth state listener');
    checkStoredTokens(); // Check stored tokens on startup
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext - Auth state changed:', firebaseUser ? 'User authenticated' : 'No user');
      try {
        if (firebaseUser) {
          console.log('AuthContext - User authenticated:', firebaseUser.email);
          // Get custom claims from user token
          const token = await firebaseUser.getIdTokenResult(true);
          const idToken = await firebaseUser.getIdToken();
          // Store the token and user id in AsyncStorage
          await AsyncStorage.setItem('userToken', idToken);
          await AsyncStorage.setItem('userId', firebaseUser.uid);
          setUser(firebaseUser);
          setClaims(token.claims);
          setError(null);
          setLoading(false); // Set loading false immediately after user is set
          console.log('AuthContext - User state set, loading set to false');
          // Fetch user role from Firestore
          try {
            console.log('AuthContext - Fetching user document for role');
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData?.role || null;
              setUserRole(role);
              console.log('AuthContext - User role set:', role);
              console.log('AuthContext - Full user data:', userData);
            } else {
              setUserRole(null);
              console.log('AuthContext - User document not found');
            }
          } catch (firestoreError) {
            console.error('Error fetching user role:', firestoreError);
            setUserRole(null);
            setError('Failed to fetch user role');
          }
        } else {
          console.log('AuthContext - No Firebase user, clearing state');
          // Clear stored tokens when no user
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userId');
          setUser(null);
          setClaims(null);
          setUserRole(null);
          setLoading(false); // <-- Set loading false if no user
        }
      } catch (authError) {
        console.error('Auth state change error:', authError);
        setError('Authentication error occurred');
        setUserRole(null);
        setLoading(false); // <-- Set loading false on error
      }
    });
    return unsubscribe;
  }, []);

  const logout = async (callback?: () => void) => {
    try {
      console.log('AuthContext - Logging out user');
      // Clear all user-related data from state immediately
      setUser(null);
      setClaims(null);
      setUserRole(null);
      setBranch(null);
      setLoading(true); // Set loading to prevent UI flashing
      
      // Clear stored tokens
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      
      // Sign out from Firebase
      await auth.signOut();
      
      setLoading(false);
      console.log('AuthContext - Logout completed successfully');
      if (callback) {
        callback();
      }
    } catch (err) {
      console.error('Error during logout:', err);
      // Even on error, clear user state and tokens
      setUser(null);
      setClaims(null);
      setUserRole(null);
      setBranch(null);
      setLoading(false);
      
      // Try to clear tokens even if Firebase signOut fails
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
      } catch (storageError) {
        console.error('Error clearing stored tokens:', storageError);
      }
      if (callback) {
        callback();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, claims, branch, setBranch, loading, userRole, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 
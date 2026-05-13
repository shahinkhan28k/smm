import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface UserData {
  uid: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubUser) {
        unsubUser();
        unsubUser = undefined;
      }

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userDoc;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (e) {
            console.error("Auth: Failed to get user doc:", e);
            // Don't throw here, let logic continue if possible
          }
          
          if (!userDoc || !userDoc.exists()) {
            const newUserData: UserData = {
              uid: user.uid,
              email: user.email || '',
              balance: 0,
              role: (user.email?.toLowerCase() === 'shahinkhan28w@gmail.com' || user.email?.toLowerCase() === 'shahinkhan28a@gmail.com' || user.uid === 'wh4zeA8S61Rf4fQ8Im3vo7sW6d03') ? 'admin' : 'user',
              displayName: user.displayName || 'User',
            };
            try {
              await setDoc(userDocRef, newUserData);
              setUserData(newUserData);
            } catch (e) {
               console.error("Auth: Failed to create user profile:", e);
               // If we can't create doc, still allow user in with basic data fallback
               setUserData(newUserData);
            }
          } else {
            const existingData = userDoc.data() as UserData;
            if (existingData.balance === undefined) existingData.balance = 0;
            
            // Auto-promote specified admins
            const isAdminEmail = user.email?.toLowerCase() === 'shahinkhan28w@gmail.com' || user.email?.toLowerCase() === 'shahinkhan28a@gmail.com';
            if (isAdminEmail && existingData.role !== 'admin') {
              try {
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
                existingData.role = 'admin';
              } catch (e) {
                console.warn("Auth: Admin sync failed:", e);
              }
            }
            setUserData(existingData);
          }

          unsubUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data() as UserData;
              if (data.balance === undefined) data.balance = 0;
              setUserData(data);
            }
          }, (err) => {
            console.error("Auth: Snapshot error:", err);
          });
        } catch (err) {
          console.error("Auth global error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

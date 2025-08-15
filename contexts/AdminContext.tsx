import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isLoginAttempted: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'SESMTRH';

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginAttempted, setIsLoginAttempted] = useState(false);

  useEffect(() => {
    // Check session storage on initial load
    try {
      const storedIsAdmin = sessionStorage.getItem('isAdmin') === 'true';
      setIsAdmin(storedIsAdmin);
    } catch (e) {
      console.error("Could not access session storage:", e);
      // Fallback to not being admin if storage is inaccessible
      setIsAdmin(false);
    } finally {
      setIsLoginAttempted(true);
    }
  }, []);


  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
        try {
            sessionStorage.setItem('isAdmin', 'true');
            setIsAdmin(true);
            return true;
        } catch (e) {
            console.error("Could not write to session storage:", e);
            // Allow login for the session even if storage fails
            setIsAdmin(true);
            return true;
        }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
        sessionStorage.removeItem('isAdmin');
    } catch (e) {
        console.error("Could not remove from session storage:", e);
    }
    setIsAdmin(false);
  }, []);

  const value = { isAdmin, login, logout, isLoginAttempted };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
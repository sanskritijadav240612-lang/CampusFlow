import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Foundation AuthContext provider.
 * Does not implement full backend token handshake yet (deferred to Auth batch),
 * but provides the reactive structure for role detection, profile state, and logout stubs.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, name, email, role, enrollmentNumber, facultyId }

  const login = (userData, accessToken) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isStudent: user?.role === 'student',
    isFaculty: user?.role === 'faculty',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

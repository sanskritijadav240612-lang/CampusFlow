import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import { setAccessToken, setOnAuthFailure } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear authentication state callback triggered by Axios when refresh fails
  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(handleAuthFailure);
  }, [handleAuthFailure]);

  // Restore session on application mount via HTTP-only cookie refresh handshake
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const response = await authService.refreshToken();
        if (isMounted && response.success && response.data) {
          setUser(response.data.user);
          setAccessToken(response.data.accessToken);
        }
      } catch (err) {
        // No active or valid refresh cookie present — user is safely unauthenticated
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Student registration (creates user, requires subsequent login per backend flow)
  const registerStudent = async (data) => {
    return await authService.registerStudent(data);
  };

  // Student login
  const loginStudent = async (credentials) => {
    const response = await authService.loginStudent(credentials);
    if (response.success && response.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
    }
    return response;
  };

  // Faculty login
  const loginFaculty = async (credentials) => {
    const response = await authService.loginFaculty(credentials);
    if (response.success && response.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
    }
    return response;
  };

  // Session Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout warning:', err.message);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isStudent: user?.role === 'student',
    isFaculty: user?.role === 'faculty',
    isLoading,
    registerStudent,
    loginStudent,
    loginFaculty,
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

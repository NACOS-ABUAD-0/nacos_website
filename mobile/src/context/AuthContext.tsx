import React, { createContext, useContext, useEffect, useReducer } from 'react';

import { authAPI, unwrapApiError } from '@/lib/api';
import { clearTokens, getRefreshToken, loadTokens, setTokens } from '@/lib/tokenStorage';

// ─── Types ──────────────────────────────────────────────────────────────────

type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  matric_number: string;
  date_joined: string;
  is_email_verified: boolean;
  is_staff?: boolean;
  role: UserRole;
  face_login_enabled?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    fullName: string,
    matricNumber: string,
    password: string,
    password2: string,
    verificationToken?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = { user: null, isLoading: true, isAuthenticated: false };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Session restore on app launch ─────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = await loadTokens();
      if (!accessToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const { data } = await authAPI.getProfile();
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data } });
      } catch {
        await clearTokens();
        dispatch({ type: 'LOGOUT' });
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { data } = await authAPI.login(email, password);
      await setTokens(data.access, data.refresh);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user } });
    } catch (err) {
      throw unwrapApiError(err);
    }
  };

  const register = async (
    email: string,
    fullName: string,
    matricNumber: string,
    password: string,
    password2: string,
    verificationToken?: string,
  ): Promise<void> => {
    try {
      const { data } = await authAPI.register(
        email,
        fullName,
        matricNumber,
        password,
        password2,
        verificationToken,
      );
      await setTokens(data.access, data.refresh);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user } });
    } catch (err) {
      throw unwrapApiError(err);
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch {
        // Best-effort server-side blacklist — proceed with local logout regardless.
      }
    }
    await clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
    } catch (err) {
      throw unwrapApiError(err);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const { data } = await authAPI.getProfile();
      dispatch({ type: 'UPDATE_USER', payload: data });
    } catch {
      // Non-fatal — keep showing the last known profile.
    }
  };

  const isAdmin = state.user?.role === 'admin' || state.user?.role === 'super_admin' || state.user?.is_staff === true;

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateProfile, refreshProfile, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

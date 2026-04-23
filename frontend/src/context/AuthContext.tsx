// frontend/src/context/AuthContext.tsx

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-hot-toast";
import { authAPI } from "../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "user" | "admin";

interface User {
  id: number;
  email: string;
  full_name: string;
  matric_number: string;
  date_joined: string;
  is_email_verified: boolean;
  profile_complete?: boolean;
  is_staff?: boolean;
  role: UserRole;        // ← RBAC role from the backend
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
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
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (uid: string, token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  /** Convenience helper — true if the current user holds admin privileges. */
  isAdmin: boolean;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; accessToken: string } }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User };

// ─── Reducer ───────────────────────────────────────────────────────────────────

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return { user: null, accessToken: null, isAuthenticated: false, isLoading: false };
    case "UPDATE_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// ─── Initial State ─────────────────────────────────────────────────────────────
// isLoading: true prevents RequireAuth / RequireAdmin from redirecting
// before the session check completes on page refresh.

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
};

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Error Handler ─────────────────────────────────────────────────────────────

function handleApiError(err: any, fallback: string): void {
  if (err && typeof err === "object") {
    Object.entries(err).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach((msg) => toast.error(`${field}: ${msg}`));
      } else {
        toast.error(String(messages));
      }
    });
  } else {
    toast.error(fallback);
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Session restore on page refresh ────────────────────────────────────────
  //
  // Strategy: call getProfile() using the stored access token.
  // The axios interceptor silently refreshes the access token if it's expired.
  // If both tokens are gone/invalid, the catch fires and we dispatch LOGOUT.
  //
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        const profileResponse = await authAPI.getProfile();
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: profileResponse.data, accessToken },
        });
      } catch {
        // Both tokens invalid — interceptor already cleared localStorage
        dispatch({ type: "LOGOUT" });
      }
    };

    initAuth();
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: response.data.user, accessToken: response.data.access },
      });
      toast.success("Login successful!");
    } catch (err: any) {
      handleApiError(err, "Login failed. Please try again.");
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ── register ───────────────────────────────────────────────────────────────

  const register = async (
    email: string,
    fullName: string,
    matricNumber: string,
    password: string,
    password2: string,
    verificationToken?: string,
  ): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authAPI.register(
        email, fullName, matricNumber, password, password2, verificationToken
      );
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: response.data.user, accessToken: response.data.access },
      });
      toast.success("Registration successful!");
    } catch (err: any) {
      handleApiError(err, "Registration failed. Please try again.");
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = (): void => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      // FIXED: authAPI.logout() expects 0 arguments, not the refresh token
      authAPI.logout().catch(console.error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch({ type: "LOGOUT" });
    toast("Logged out.", { icon: "👋" });
  };

  // ── updateProfile ──────────────────────────────────────────────────────────

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authAPI.updateProfile(data);
      dispatch({ type: "UPDATE_USER", payload: response.data });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        logout();
      } else {
        handleApiError(err, "Failed to update profile. Please try again.");
      }
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ── verifyEmail ────────────────────────────────────────────────────────────

  const verifyEmail = async (uid: string, token: string): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // FIXED: Added verifyEmail method to authAPI
      const response = await authAPI.verifyEmail(uid, token);
      if (response.data.user) {
        dispatch({ type: "UPDATE_USER", payload: response.data.user });
      }
      toast.success("Email verified successfully!");
    } catch (err: any) {
      toast.error(err?.error ?? err?.message ?? "Failed to verify email. Please try again.");
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ── resendVerificationEmail ────────────────────────────────────────────────

  const resendVerificationEmail = async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // FIXED: Added resendVerification method to authAPI
      await authAPI.resendVerification();
      toast.success("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err?.error ?? err?.message ?? "Failed to send verification email.");
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const isAdmin =
    state.user?.role === "admin" || state.user?.is_staff === true;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        verifyEmail,
        resendVerificationEmail,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
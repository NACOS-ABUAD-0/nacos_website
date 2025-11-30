import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-hot-toast";
import { authAPI } from "../lib/api";

interface User {
  id: number;
  email: string;
  full_name: string;
  matric_number: string;
  date_joined: string;
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
    matricNumber?: string,
    password?: string,
    password2?: string
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; accessToken: string } }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("refreshToken");
      if (token) {
        try {
          const response = await authAPI.refreshToken(token);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.data.user,
              accessToken: response.data.access,
            },
          });
          localStorage.setItem("refreshToken", response.data.refresh);
        } catch {
          localStorage.removeItem("refreshToken");
        }
      }
      dispatch({ type: "SET_LOADING", payload: false });
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authAPI.login(email, password);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.data.user,
          accessToken: response.data.access,
        },
      });

      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      toast.success("Login successful!");
    } catch (err: any) {
      // Show per-field login errors
      if (typeof err === "object") {
        Object.entries(err).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(`${field}: ${msg}`));
          } else {
            toast.error(`${field}: ${messages}`);
          }
        });
      } else {
        toast.error("Login failed. Please try again.");
      }
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (
    email: string,
    fullName: string,
    matricNumber?: string,
    password?: string,
    password2?: string
  ) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authAPI.register(email, fullName, matricNumber, password!, password2!);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.data.user,
          accessToken: response.data.access,
        },
      });


      toast.success("Registration successful!");
    } catch (err: any) {
      // Show all validation errors
      if (typeof err === "object") {
        Object.entries(err).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(`${field}: ${msg}`));
          } else {
            toast.error(`${field}: ${messages}`);
          }
        });
      } else {
        toast.error("Registration failed. Please try again.");
      }
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(console.error);
    }
    localStorage.removeItem("refreshToken");
    dispatch({ type: "LOGOUT" });
    toast("Logged out.", { icon: "👋" });
  };

const updateProfile = async (data: Partial<User>) => {
  dispatch({ type: "SET_LOADING", payload: true });
  try {
    const response = await authAPI.updateProfile(data);

    dispatch({ type: "UPDATE_USER", payload: response.data });

    toast.success("Profile updated successfully!");
  } catch (err: any) {
    if (err.detail) {
      // Show field-specific errors if provided
      Object.entries(err).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((msg) => toast.error(`${field}: ${msg}`));
        } else {
          toast.error(`${field}: ${messages}`);
        }
      });
    } else if (err.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
      logout();
    } else {
      toast.error("Failed to update profile. Please try again.");
    }
    throw err;
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};


  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

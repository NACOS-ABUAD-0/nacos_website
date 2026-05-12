/**
 * Face Authentication API service.
 * Uses the same base URL logic and localStorage keys as src/lib/api.ts.
 */

import { buildBaseURL } from "../lib/api";

const API_BASE = buildBaseURL();

// ── Token key MUST match AuthContext ("accessToken" not "access_token") ────────
function authHeaders(): Record<string, string> {
  const access = localStorage.getItem("accessToken"); // ← camelCase, matches AuthContext
  return {
    "Content-Type": "application/json",
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };
}

// ── Response handler ───────────────────────────────────────────────────────────
async function handleResponse<T>(res: Response): Promise<T> {
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // empty body
  }

  if (!res.ok) {
    const message =
      (data?.error as string) ??
      (data?.detail as string) ??
      (data?.non_field_errors as string[])?.[0] ??
      `Request failed with status ${res.status}.`;
    throw new Error(message);
  }

  return data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FaceStatusResponse {
  face_login_enabled: boolean;
  embeddings_count: number;
  max_embeddings: number;
}

export interface FaceRegisterResponse {
  message: string;
  embeddings_stored: number;
  face_login_enabled: boolean;
  warnings?: string[];
}

export interface FaceLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    matric_number: string;
    date_joined: string;
    is_email_verified: boolean;
    is_staff: boolean;
    role: "user" | "admin";
    face_login_enabled: boolean;
  };
  confidence: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const faceAuthService = {
  async getStatus(): Promise<FaceStatusResponse> {
    const res = await fetch(`${API_BASE}/face-auth/status/`, {
      headers: authHeaders(),
    });
    return handleResponse<FaceStatusResponse>(res);
  },

  async register(images: string[]): Promise<FaceRegisterResponse> {
    const res = await fetch(`${API_BASE}/face-auth/register/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ images }),
    });
    return handleResponse<FaceRegisterResponse>(res);
  },

  async login(email: string, image: string): Promise<FaceLoginResponse> {
    const res = await fetch(`${API_BASE}/face-auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, image }),
    });
    return handleResponse<FaceLoginResponse>(res);
  },

  async deleteFaceData(): Promise<{ message: string; face_login_enabled: false }> {
    const res = await fetch(`${API_BASE}/face-auth/delete/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
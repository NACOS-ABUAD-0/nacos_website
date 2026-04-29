// frontend/src/services/faceAuthService.ts
/**
 * Face Authentication API service.
 * Mirrors the pattern of whatever existing API client the project uses,
 * but implemented with plain fetch so it has zero extra dependencies.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function authHeaders(): Record<string, string> {
  const access = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error ?? data?.detail ?? data?.non_field_errors?.[0] ?? "Request failed.";
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
  user: Record<string, unknown>;
  confidence: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const faceAuthService = {
  /** GET /api/face-auth/status/ */
  async getStatus(): Promise<FaceStatusResponse> {
    const res = await fetch(`${API_BASE}/face-auth/status/`, {
      headers: authHeaders(),
    });
    return handleResponse<FaceStatusResponse>(res);
  },

  /**
   * POST /api/face-auth/register/
   * @param images  Array of base64 data URL strings (1–5)
   */
  async register(images: string[]): Promise<FaceRegisterResponse> {
    const res = await fetch(`${API_BASE}/face-auth/register/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ images }),
    });
    return handleResponse<FaceRegisterResponse>(res);
  },

  /**
   * POST /api/face-auth/login/
   * @param email  User's email
   * @param image  Single base64 data URL string
   */
  async login(email: string, image: string): Promise<FaceLoginResponse> {
    const res = await fetch(`${API_BASE}/face-auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, image }),
    });
    return handleResponse<FaceLoginResponse>(res);
  },

  /** DELETE /api/face-auth/delete/ */
  async deleteFaceData(): Promise<{ message: string; face_login_enabled: false }> {
    const res = await fetch(`${API_BASE}/face-auth/delete/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// axios interceptors need synchronous-ish access to the current token, but
// SecureStore's API is async — so we mirror both tokens in memory, loaded
// once at app boot via loadTokens() before any authenticated screen renders.
let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;

export async function loadTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessTokenCache = accessToken;
  refreshTokenCache = refreshToken;
  return { accessToken, refreshToken };
}

export function getAccessToken(): string | null {
  return accessTokenCache;
}

export function getRefreshToken(): string | null {
  return refreshTokenCache;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessTokenCache = access;
  refreshTokenCache = refresh;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessTokenCache = null;
  refreshTokenCache = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export type AuthMode = 'legacy' | 'oidc-pkce';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'token',
  sessionId: 'sessionId',
  mode: 'arsipku_auth_mode',
  activeProfile: 'arsipku_active_profile',
} as const;

const hasStorage = (): boolean => process.client && typeof localStorage !== 'undefined';

export const getStoredAccessToken = (): string | null =>
  hasStorage() ? localStorage.getItem(AUTH_STORAGE_KEYS.accessToken) : null;

export const getStoredSessionId = (): string | null =>
  hasStorage() ? localStorage.getItem(AUTH_STORAGE_KEYS.sessionId) : null;

export const getStoredAuthMode = (fallback: AuthMode = 'legacy'): AuthMode => {
  if (!hasStorage()) return fallback;
  return localStorage.getItem(AUTH_STORAGE_KEYS.mode) === 'oidc-pkce' ? 'oidc-pkce' : fallback;
};

export const setStoredAuthSession = (
  accessToken: string,
  sessionId: string,
  mode: AuthMode
): void => {
  if (!hasStorage()) return;
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.sessionId, sessionId);
  localStorage.setItem(AUTH_STORAGE_KEYS.mode, mode);
};

export const replaceStoredAccessToken = (accessToken: string): void => {
  if (!hasStorage()) return;
  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
};

export const clearStoredAuthSession = (): void => {
  if (!hasStorage()) return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.sessionId);
  localStorage.removeItem(AUTH_STORAGE_KEYS.mode);
  localStorage.removeItem(AUTH_STORAGE_KEYS.activeProfile);
};

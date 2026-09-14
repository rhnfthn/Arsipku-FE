interface OidcClientConfig {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

interface OidcTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
  createdAt: number;
  returnTo: string;
}

const OIDC_TRANSACTION_KEY = 'arsipku_oidc_transaction';
const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000;

const encodeBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const createRandomValue = (length = 32): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
};

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
};

export const sanitizeAuthReturnTo = (returnTo?: string | null): string => {
  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.startsWith('/auth/callback') ||
    returnTo.startsWith('/autharsipku')
  ) {
    return '/beranda';
  }
  return returnTo;
};

export const useOidcPkce = () => {
  const config = useRuntimeConfig();

  const clearTransaction = (): void => {
    if (process.client) sessionStorage.removeItem(OIDC_TRANSACTION_KEY);
  };

  const getClientConfig = async (): Promise<OidcClientConfig> => {
    const response: any = await $fetch('/auth/oidc/config', {
      baseURL: String(config.public.apiBaseUrl || ''),
    });
    const value = response?.data ?? response;
    if (!value?.authorizeUrl || !value?.clientId || !value?.redirectUri) {
      throw new Error('Konfigurasi OIDC belum lengkap');
    }
    return value as OidcClientConfig;
  };

  const createAuthorizeUrl = async (returnTo?: string): Promise<string> => {
    if (!process.client) throw new Error('PKCE hanya dapat dimulai di browser');

    const client = await getClientConfig();
    const codeVerifier = createRandomValue(64);
    const state = createRandomValue();
    const nonce = createRandomValue();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    const transaction: OidcTransaction = {
      state,
      nonce,
      codeVerifier,
      createdAt: Date.now(),
      returnTo: sanitizeAuthReturnTo(returnTo),
    };
    sessionStorage.setItem(OIDC_TRANSACTION_KEY, JSON.stringify(transaction));

    const url = new URL(client.authorizeUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', client.clientId);
    url.searchParams.set('redirect_uri', client.redirectUri);
    url.searchParams.set('scope', client.scope || 'openid profile email');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  };

  const consumeTransaction = (receivedState: string): OidcTransaction => {
    if (!process.client) throw new Error('Callback OIDC hanya dapat diproses di browser');

    const raw = sessionStorage.getItem(OIDC_TRANSACTION_KEY);
    clearTransaction();
    if (!raw) throw new Error('Transaksi login tidak ditemukan. Silakan login kembali.');

    let transaction: OidcTransaction;
    try {
      transaction = JSON.parse(raw) as OidcTransaction;
    } catch {
      throw new Error('Data transaksi login tidak valid. Silakan login kembali.');
    }
    if (!receivedState || transaction.state !== receivedState) {
      throw new Error('State callback tidak valid. Login dibatalkan demi keamanan.');
    }
    if (Date.now() - transaction.createdAt > OIDC_TRANSACTION_TTL_MS) {
      throw new Error('Transaksi login telah kedaluwarsa. Silakan login kembali.');
    }
    if (!transaction.codeVerifier) throw new Error('PKCE verifier tidak ditemukan.');
    return transaction;
  };

  return { createAuthorizeUrl, consumeTransaction, clearTransaction };
};

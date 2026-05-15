import * as WebBrowser from 'expo-web-browser';
import { appConfig } from '../config';

WebBrowser.maybeCompleteAuthSession();

// ─── Browser OAuth via backend redirect ───────────────────────────────────────
//
// Flow:
//   App → provider (LINE / Google) → backend GET /callback → sccrm://oauth?params
//
// The backend exchanges the code, issues session tokens, and redirects back to
// the app via the sccrm:// deep link. PKCE is omitted because the code exchange
// happens server-side (the backend cannot know the client-generated verifier).

async function runBrowserAuth(authUrl: string): Promise<URLSearchParams> {
  const result = await WebBrowser.openAuthSessionAsync(authUrl, appConfig.authRedirectUri);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Authentication was cancelled.');
  }
  // result.url is sccrm://oauth?accessToken=...  (or ?error=...)
  const parsed = new URL(result.url);
  const error = parsed.searchParams.get('error');
  if (error) throw new Error(error);
  return parsed.searchParams;
}

export async function startLineLogin(): Promise<URLSearchParams> {
  if (!appConfig.lineChannelId) {
    throw new Error('EXPO_PUBLIC_LINE_CHANNEL_ID is not configured.');
  }
  if (!appConfig.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }
  const state = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const redirectUri = `${appConfig.apiBaseUrl}/api/sccrm/auth/line/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appConfig.lineChannelId,
    redirect_uri: redirectUri,
    state,
    scope: 'profile openid email',
  });
  return runBrowserAuth(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
}

export async function startGoogleLogin(): Promise<URLSearchParams> {
  if (!appConfig.googleClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured.');
  }
  if (!appConfig.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }
  const state = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const redirectUri = `${appConfig.apiBaseUrl}/api/sccrm/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: appConfig.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return runBrowserAuth(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

import * as AuthSession from 'expo-auth-session';

const redirectUri =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URI ||
  AuthSession.makeRedirectUri({
    scheme: 'sccrm',
    path: 'oauth',
  });

function trimTrailingSlash(value: string | undefined) {
  return (value || '').replace(/\/+$/, '');
}

export const appConfig = {
  apiBaseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL),
  lineChannelId: process.env.EXPO_PUBLIC_LINE_CHANNEL_ID || '',
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  authRedirectUri: redirectUri,
};

export function requireApiBaseUrl() {
  if (!appConfig.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }
  return appConfig.apiBaseUrl;
}

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { encode as encodeBase64 } from 'base-64';

import { appConfig } from '../config';

WebBrowser.maybeCompleteAuthSession();

function base64Url(value: string) {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createPkcePair() {
  const bytes = Crypto.getRandomBytes(32);
  const verifier = base64Url(encodeBase64(String.fromCharCode(...bytes)));
  const challenge = base64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    })
  );
  return { verifier, challenge };
}

async function runBrowserAuth(url: string) {
  const result = await WebBrowser.openAuthSessionAsync(url, appConfig.authRedirectUri);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Authentication was cancelled.');
  }
  const parsed = new URL(result.url);
  const error = parsed.searchParams.get('error');
  if (error) throw new Error(error);
  const code = parsed.searchParams.get('code');
  if (!code) {
    throw new Error('Provider did not return an authorization code.');
  }
  return code;
}

export async function startLineLogin() {
  if (!appConfig.lineChannelId) {
    throw new Error('EXPO_PUBLIC_LINE_CHANNEL_ID is not configured.');
  }
  const { challenge } = await createPkcePair();
  const state = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appConfig.lineChannelId,
    redirect_uri: appConfig.authRedirectUri,
    state,
    scope: 'profile openid',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return runBrowserAuth(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
}

export async function startGoogleLogin() {
  if (!appConfig.googleClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured.');
  }
  const { challenge } = await createPkcePair();
  const state = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const params = new URLSearchParams({
    client_id: appConfig.googleClientId,
    redirect_uri: appConfig.authRedirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return runBrowserAuth(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

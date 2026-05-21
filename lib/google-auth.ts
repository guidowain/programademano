const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const oauthTokenCache = new Map<string, {
  accessToken: string;
  expiresAt: number;
}>();

export async function getGoogleOAuthAccessToken({
  clientId,
  clientSecret,
  refreshToken,
  cacheKey,
}: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  cacheKey: string;
}) {
  const cachedToken = oauthTokenCache.get(cacheKey);

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || "No se pudo autenticar con Google Analytics.");
  }

  oauthTokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  });

  return data.access_token;
}

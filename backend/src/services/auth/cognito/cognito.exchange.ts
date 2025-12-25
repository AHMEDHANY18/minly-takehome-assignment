import axios from "axios";

export async function cognitoExchangeCode(args: {
  domain: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}) {
  const tokenUrl = `${args.domain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: args.clientId,
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (args.clientSecret) {
    headers.Authorization =
      "Basic " + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString("base64");
  }

  const { data } = await axios.post(tokenUrl, body.toString(), { headers });
  return data as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    id_token?: string;
  };
}

export async function cognitoRefreshToken(args: {
  domain: string;
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
}) {
  const tokenUrl = `${args.domain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: args.clientId,
    refresh_token: args.refreshToken,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (args.clientSecret) {
    headers.Authorization =
      "Basic " + Buffer.from(`${args.clientId}:${args.clientSecret}`).toString("base64");
  }

  const { data } = await axios.post(tokenUrl, body.toString(), { headers });
  return data as { access_token?: string; expires_in?: number };
}

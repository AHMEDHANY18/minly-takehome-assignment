import { Request, Response } from "express";
import axios from "axios";
import { verifyCognitoToken } from "../../services/auth/cognito/cognito.verify";
import { UserRepository, type OAuthProvider } from "../../repositories/user.repository";

export async function cognitoCallback(req: Request, res: Response) {
  const domain = process.env.COGNITO_DOMAIN!;
  const clientId = process.env.COGNITO_CLIENT_ID!;
  const clientSecret = process.env.COGNITO_CLIENT_ID_SECRET!;
  const redirectUri = process.env.COGNITO_REDIRECT_URI!;

  try {
    const code = req.query.code?.toString();
    if (!code) return res.status(400).json({ message: "Missing code" });

    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    });

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const { data } = await axios.post(tokenUrl, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
    });

    const { access_token, id_token } = data;

    const payload = await verifyCognitoToken(id_token);

    const { data: userInfo } = await axios.get(`${domain}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const email = userInfo?.email ?? payload?.email;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const identities: Array<{ provider: OAuthProvider; providerId: string }> = [
      { provider: "cognito", providerId: payload.sub },
    ];

    const googleIdentity = payload?.identities?.find(
      (i: any) => i?.providerName === "Google"
    );

    if (googleIdentity?.userId) {
      identities.push({
        provider: "google",
        providerId: googleIdentity.userId,
      });
    }

    const name =
      userInfo?.name ??
      [userInfo?.given_name, userInfo?.family_name].filter(Boolean).join(" ") ??
      email;

    const avatarUrl = userInfo?.picture ?? null;

    const user = await UserRepository.upsertOAuthUser({
      email,
      name,
      avatarUrl,
      identities,
    });

    return res.json({ accessToken: access_token, user });
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return res.status(400).json({
        message: "Cognito request failed",
        details: err.response?.data ?? err.message,
      });
    }
    return res.status(500).json({
      message: "Unexpected error",
      details: err?.message ?? String(err),
    });
  }
}

import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: process.env.COGNITO_JWKS_URL!,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header: JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) return callback(new Error("Missing kid"));
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key!.getPublicKey());
  });
}

type TokenUse = "access" | "id";

export function verifyCognitoToken<T = any>(
  token: string,
  opts: { expectedUse: TokenUse; clientId: string }
): Promise<T> {
  const issuer = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      { algorithms: ["RS256"], issuer },
      (err, decoded) => {
        if (err) return reject(err);

        const p = decoded as any;

        // 1) must be correct use
        if (p?.token_use !== opts.expectedUse) {
          return reject(
            new Error(
              `Invalid token_use. Expected ${opts.expectedUse}, got ${p?.token_use}`
            )
          );
        }

        // 2) bind to client app
        if (opts.expectedUse === "access") {
          if (p?.client_id !== opts.clientId) {
            return reject(new Error("Invalid client_id for access token"));
          }
        } else {
          if (p?.aud !== opts.clientId) {
            return reject(new Error("Invalid aud for id token"));
          }
        }

        if (!p?.sub) return reject(new Error("Missing sub"));
        resolve(p as T);
      }
    );
  });
}

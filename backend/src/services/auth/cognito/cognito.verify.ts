import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: process.env.COGNITO_JWKS_URL!,
});

function getKey(header: any, callback: any): any {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, undefined);
    } else if (key && typeof key.getPublicKey === "function") {
      callback(null, key.getPublicKey());
    } else {
      callback(new Error("Signing key is unavailable or invalid"), undefined);
    }
  });
}

export function verifyCognitoToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ["RS256"],
        issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      },
      (err, decoded) => {
        console.log("🚀 ~ returnnewPromise ~ decoded:", decoded)
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

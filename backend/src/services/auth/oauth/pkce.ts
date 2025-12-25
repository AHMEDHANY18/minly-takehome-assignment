import crypto from "crypto";

function base64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest();
}

export function generateState() {
  return base64Url(crypto.randomBytes(32));
}

export function generatePKCE() {
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(sha256(verifier));
  return { verifier, challenge };
}

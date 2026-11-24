import { createHmac, timingSafeEqual } from "node:crypto";
function secret() {
  const value = process.env.SHARE_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("SHARE_TOKEN_SECRET must contain at least 32 characters.");
  return value;
}
function sign(id: string, exp: number) {
  return createHmac("sha256", secret()).update(`${id}.${exp}`).digest("base64url");
}
export function createShareToken(id: string, expiresAtMs: number) {
  const exp = Math.floor(expiresAtMs / 1000);
  return `${exp}.${sign(id, exp)}`;
}
export function verifyShareToken(id: string, token: string | null) {
  if (!token || !/^\d{10}\.[A-Za-z0-9_-]{40,50}$/.test(token)) return false;
  const [expText, supplied] = token.split(".");
  const exp = Number(expText);
  if (!Number.isSafeInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return false;
  const a = Buffer.from(sign(id, exp)), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

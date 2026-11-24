import { timingSafeEqual } from "node:crypto";
function equalSecret(expected: string | undefined, supplied: string | undefined) {
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function hasApiKey(request: Request) {
  return equalSecret(process.env.BRIDGE_API_KEY, request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]);
}
export function hasCronSecret(request: Request) {
  return equalSecret(process.env.CRON_SECRET, request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]);
}
export function unauthorized() { return Response.json({ error: "Unauthorized" }, { status: 401 }); }

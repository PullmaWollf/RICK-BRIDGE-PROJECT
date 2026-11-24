export const runtime = "nodejs";
export async function GET() {
  const required = ["BRIDGE_API_KEY","SHARE_TOKEN_SECRET","BLOB_STORE_ID"];
  const missing = required.filter(k => !process.env[k]);
  return Response.json({ service:"RICK BRIDGE SERVER", status:missing.length ? "needs_configuration" : "ok", missing, time:new Date().toISOString() });
}

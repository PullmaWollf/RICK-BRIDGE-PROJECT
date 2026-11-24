import { headPrivateBlob, saveMeta, type FileMeta } from "@/lib/storage";
import { createShareToken } from "@/lib/tokens";
import { hasApiKey, unauthorized } from "@/lib/auth";
export const runtime = "nodejs";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  if (!hasApiKey(request)) return unauthorized();
  try {
    const body = await request.json() as { id?:string; pathname?:string; originalName?:string; ttlSeconds?:number };
    if (!body.id || !UUID_RE.test(body.id)) return Response.json({error:"Invalid file id."},{status:400});
    if (!body.pathname || !body.pathname.startsWith(`rick-bridge/files/${body.id}/`) || body.pathname.includes("..")) return Response.json({error:"Invalid file path."},{status:400});
    const ttl = body.ttlSeconds ?? 1800;
    if (!Number.isSafeInteger(ttl) || ttl < 60 || ttl > 86400) return Response.json({error:"Invalid TTL."},{status:400});
    const blob = await headPrivateBlob(body.pathname);
    if (blob && blob.size > 500 * 1024 * 1024) return Response.json({error:"File too large."},{status:413});
    if (!blob) return Response.json({error:"Uploaded blob not found."},{status:404});
    const originalName = String(body.originalName || "file.bin").replace(/[\\/\r\n"]/g,"_").slice(0,180);
    const expiresAt = Date.now() + ttl * 1000;
    const meta: FileMeta = { id:body.id, pathname:body.pathname, originalName, size:blob.size, contentType:blob.contentType || "application/octet-stream", createdAt:new Date().toISOString(), expiresAt };
    await saveMeta(meta);
    const shareToken = createShareToken(meta.id, meta.expiresAt);
    const origin = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/,"") || new URL(request.url).origin;
    return Response.json({ ok:true, file:meta, shareToken, shareUrl:`${origin}/api/shared/${meta.id}?t=${encodeURIComponent(shareToken)}`, mcpUrl:`${origin}/api/mcp` });
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : "Registration failed."},{status:500});
  }
}

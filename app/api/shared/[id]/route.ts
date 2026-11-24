import { readMeta, getPrivateBlob } from "@/lib/storage";
import { verifyShareToken } from "@/lib/tokens";
export const runtime = "nodejs";
type Context = { params: Promise<{id:string}> };
const INLINE = new Set(["image/png","image/jpeg","image/webp","image/gif","audio/mpeg","audio/wav","audio/ogg","video/mp4","video/webm"]);
export async function GET(request:Request, context:Context) {
  const {id} = await context.params;
  const token = new URL(request.url).searchParams.get("t");
  if (!verifyShareToken(id,token)) return Response.json({error:"Invalid or expired share token."},{status:401});
  const meta = await readMeta(id);
  if (!meta) return Response.json({error:"File not found or expired."},{status:404});
  const blob = await getPrivateBlob(meta.pathname);
  if (!blob?.stream) return Response.json({error:"File bytes not found."},{status:404});
  const safeName = meta.originalName.replace(/["\\r\\n]/g,"_");
  return new Response(blob.stream,{headers:{
    "Content-Type":meta.contentType || "application/octet-stream",
    "Content-Length":String(meta.size),
    "Content-Disposition":`${INLINE.has(meta.contentType) ? "inline" : "attachment"}; filename="${safeName.replace(/[^\x20-\x7E]/g,"_")}"; filename*=UTF-8''${encodeURIComponent(safeName).replace(/['()*]/g,c=>"%"+c.charCodeAt(0).toString(16))}`,
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  }});
}

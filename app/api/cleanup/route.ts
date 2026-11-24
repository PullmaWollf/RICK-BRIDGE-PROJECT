import { hasCronSecret, unauthorized } from "@/lib/auth";
import { deleteFile, listMetaPathnames, readMetaByPath } from "@/lib/storage";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request:Request) {
  if (!hasCronSecret(request)) return unauthorized();
  const paths = await listMetaPathnames();
  let deleted = 0;
  for (const p of paths) {
    const meta = await readMetaByPath(p);
    if (meta && meta.expiresAt <= Date.now()) { await deleteFile(meta); deleted++; }
  }
  return Response.json({ok:true,scanned:paths.length,deleted});
}

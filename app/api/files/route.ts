import { listMetaPathnames, readMetaByPath, type FileMeta } from "@/lib/storage";
import { hasApiKey, unauthorized } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!hasApiKey(request)) return unauthorized();
  try {
    const paths = await listMetaPathnames();
    const files: FileMeta[] = [];
    for (const p of paths) {
      const meta = await readMetaByPath(p);
      if (meta && meta.expiresAt > Date.now()) files.push(meta);
    }
    files.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return Response.json({files});
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : "Could not list files."},{status:500});
  }
}

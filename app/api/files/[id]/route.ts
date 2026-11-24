import { deleteFile, readMeta } from "@/lib/storage";
import { hasApiKey, unauthorized } from "@/lib/auth";
export const runtime = "nodejs";
type Context = { params: Promise<{id:string}> };
export async function GET(request:Request, context:Context) {
  if (!hasApiKey(request)) return unauthorized();
  const {id} = await context.params;
  const meta = await readMeta(id);
  if (!meta) return Response.json({error:"File not found or expired."},{status:404});
  return Response.json({file:meta});
}
export async function DELETE(request:Request, context:Context) {
  if (!hasApiKey(request)) return unauthorized();
  const {id} = await context.params;
  const meta = await readMeta(id);
  if (!meta) return Response.json({error:"File not found or expired."},{status:404});
  await deleteFile(meta);
  return Response.json({ok:true,deleted:id});
}

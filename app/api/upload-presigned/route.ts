import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { hasApiKey } from "@/lib/auth";
export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!hasApiKey(request)) return Response.json({ error:"Unauthorized" }, { status:401 });
  try {
    const body = await request.json() as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body, request,
      getSignedToken: async (pathname, clientPayload) => {
        let payload: { id?: string; maxBytes?: number };
        try { payload = JSON.parse(clientPayload || "{}"); } catch { throw new Error("Invalid upload metadata."); }
        if (!payload.id || !UUID_RE.test(payload.id)) throw new Error("Invalid file id.");
        if (!pathname.startsWith(`rick-bridge/files/${payload.id}/`) || pathname.includes("..")) throw new Error("Invalid upload path.");
        const maximumSizeInBytes = Math.min(MAX_UPLOAD_BYTES, Number(payload.maxBytes ?? MAX_UPLOAD_BYTES));
        if (!Number.isSafeInteger(maximumSizeInBytes) || maximumSizeInBytes < 1) throw new Error("Invalid upload limit.");
        const validUntil = Date.now() + 10 * 60 * 1000;
        const token = await issueSignedToken({ pathname, operations:["put"], maximumSizeInBytes, validUntil });
        return { token, urlOptions:{ maximumSizeInBytes, validUntil, addRandomSuffix:false, allowOverwrite:false } };
      }
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error:error instanceof Error ? error.message : "Upload authorization failed." }, { status:400 });
  }
}

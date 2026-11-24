import { del, get, head, list, put } from "@vercel/blob";
export type FileMeta = {
  id: string; pathname: string; originalName: string; size: number;
  contentType: string; createdAt: string; expiresAt: number;
};
const PREFIX = "rick-bridge/meta/";
export const metaPath = (id: string) => `${PREFIX}${id}.json`;
export async function saveMeta(meta: FileMeta) {
  await put(metaPath(meta.id), JSON.stringify(meta), {
    access: "private", addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/json", cacheControlMaxAge: 60
  });
}
export async function readMetaRaw(id: string): Promise<FileMeta | null> {
  const result = await get(metaPath(id), { access: "private" });
  if (!result?.stream) return null;
  return JSON.parse(await new Response(result.stream).text()) as FileMeta;
}
export async function deleteFile(meta: FileMeta) {
  await del(meta.pathname, { access: "private" });
  await del(metaPath(meta.id), { access: "private" });
}
export async function readMeta(id: string): Promise<FileMeta | null> {
  const meta = await readMetaRaw(id);
  if (!meta) return null;
  if (meta.expiresAt <= Date.now()) { return null; }
  return meta;
}
export const getPrivateBlob = (pathname: string) => get(pathname, { access: "private" });
export const headPrivateBlob = (pathname: string) => head(pathname, { access: "private" });
export async function listMetaPathnames() {
  const all: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, limit: 1000, cursor, access: "private" });
    all.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return all;
}
export async function readMetaByPath(pathname: string): Promise<FileMeta | null> {
  const result = await get(pathname, { access: "private" });
  if (!result?.stream) return null;
  return JSON.parse(await new Response(result.stream).text()) as FileMeta;
}

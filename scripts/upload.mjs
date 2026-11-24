import { uploadPresigned } from "@vercel/blob/client";
import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const configPath = resolve(process.env.APPDATA || resolve(homedir(),"AppData","Roaming"),"RickBridge","config.json");

async function loadConfig() {
  try { return JSON.parse((await readFile(configPath,"utf8")).replace(/^\uFEFF/,"")); }
  catch { throw new Error(`Configuração não encontrada: ${configPath}. Execute RICK-BRIDGE-SETUP.bat primeiro.`); }
}
function safeName(name) {
  return name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu,"_").slice(0,140) || "file.bin";
}
function mimeFromExtension(name) {
  const ext = extname(name).toLowerCase();
  const types = {
    ".txt":"text/plain",".log":"text/plain",".csv":"text/csv",".json":"application/json",".xml":"application/xml",
    ".pdf":"application/pdf",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".gif":"image/gif",
    ".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",".xls":"application/vnd.ms-excel",
    ".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",".zip":"application/zip",
    ".mp3":"audio/mpeg",".wav":"audio/wav",".sqlite":"application/vnd.sqlite3",".db":"application/octet-stream",
    ".dll":"application/octet-stream",".exe":"application/octet-stream"
  };
  return types[ext] || "application/octet-stream";
}
async function main() {
  let filePath = process.argv[2];
  if (!filePath) {
    const rl = createInterface({input:stdin,output:stdout});
    filePath = await rl.question("Caminho completo do arquivo: ");
    rl.close();
  }
  filePath = resolve(filePath.replace(/^["']|["']$/g,""));
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error("O caminho informado não é um arquivo.");

  const cfg = await loadConfig();
  const baseUrl = String(cfg.baseUrl || "").replace(/\/+$/,"");
  const apiKey = String(cfg.apiKey || "");
  const ttlSeconds = Math.min(86400,Math.max(60,Number(cfg.ttlSeconds || 1800)));
  const maxBytes = Math.min(500*1024*1024,Number(cfg.maxUploadBytes ?? 500*1024*1024));
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isSafeInteger(ttlSeconds)) throw new Error("Limites inválidos na configuração.");
  if (!/^https:\/\/[^/]+$/i.test(baseUrl)) throw new Error("A URL base precisa ser HTTPS e não pode conter caminho.");
  if (apiKey.length < 32) throw new Error("A chave da API parece inválida.");
  if (info.size > maxBytes) throw new Error(`Arquivo excede o limite configurado (${maxBytes} bytes).`);

  const originalName = basename(filePath);
  const id = randomUUID();
  const pathname = `rick-bridge/files/${id}/${safeName(originalName)}`;
  const contentType = mimeFromExtension(originalName);

  console.log(`\nRICK BRIDGE — enviando ${originalName}`);
  console.log(`Tamanho: ${(info.size/1024/1024).toFixed(2)} MB | validade: ${ttlSeconds}s`);

  // Buffer-based client: convenient for normal diagnostics. For multi-GB files,
  // replace this with a streaming uploader to avoid holding the whole file in RAM.
  const bytes = await readFile(filePath);
  const body = new Blob([bytes],{type:contentType});

  const uploaded = await uploadPresigned(pathname,body,{
    access:"private",
    handleUploadUrl:`${baseUrl}/api/upload-presigned`,
    headers:{Authorization:`Bearer ${apiKey}`},
    clientPayload:JSON.stringify({id,maxBytes}),
    contentType,
    multipart:info.size > 50*1024*1024,
    onUploadProgress:({percentage})=>stdout.write(`\rUpload: ${Math.floor(percentage)}%   `)
  });

  console.log("\nUpload concluído. Registrando arquivo...");
  const response = await fetch(`${baseUrl}/api/register`,{
    method:"POST",
    headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({id,pathname:uploaded.pathname,originalName,ttlSeconds})
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Registro falhou: HTTP ${response.status}. O upload pode ter sido concluído, mas ficou sem link registrado.`);

  console.log("\n========================================");
  console.log("UPLOAD CONCLUÍDO");
  console.log("========================================");
  console.log(`Arquivo: ${result.file.originalName}`);
  console.log(`ID: ${result.file.id}`);
  console.log(`Tamanho: ${result.file.size} bytes`);
  console.log(`Expira em: ${new Date(result.file.expiresAt).toLocaleString()}`);
  console.log(`\nLINK TEMPORÁRIO:\n${result.shareUrl}`);
  console.log(`\nTOKEN PARA MCP:\n${result.shareToken}`);
  console.log(`\nENDPOINT MCP:\n${result.mcpUrl}`);
  console.log("\nEnvie o link ou ID + token na conversa. Não compartilhe o token publicamente.");
}
main().catch(error=>{console.error("\nERRO:",error instanceof Error?error.message:error);process.exitCode=1;});

# RICK BRIDGE SERVER

Servidor privado de transferência de arquivos para análise via REST e MCP.

## Incluído
- Next.js App Router hospedado na Vercel.
- Vercel Blob **Private Storage**.
- Upload direto assinado e multipart.
- API REST protegida por `BRIDGE_API_KEY`.
- Links de leitura temporários assinados por HMAC e restritos a um único arquivo.
- MCP Streamable HTTP em `/api/mcp`.
- Leitura MCP inline de imagens, texto, CSV, JSON, XLSX e DOCX.
- Cliente Windows com seletor de arquivos (`RICK-BRIDGE.bat`).
- Limpeza oportunista e rotina diária.

## Segurança
O Blob Store precisa ser **Private**. Não use Public Storage.
O computador usa `BRIDGE_API_KEY` para uploads e REST.
O MCP não recebe a chave administrativa: cada ferramenta exige um `shareToken` HMAC específico do arquivo.
O endpoint `/api/shared/:id` valida o token e busca os bytes pelo SDK privado. Os arquivos não têm URL pública do Blob.
O token de compartilhamento não é one-time: ele pode ser reutilizado até expirar. Isso evita que uma primeira tentativa de leitura consuma o acesso antes da análise.
A expiração lógica bloqueia acesso imediatamente; a remoção física ocorre no primeiro acesso após expirar ou na limpeza diária.

## Pré-requisitos
- Conta Vercel e Node.js 20.11+ no PC.
- npm.
- Vercel Blob Private Store conectado ao projeto.

## 1. Criar o Blob privado
No painel Vercel: projeto → Storage → Create Blob → escolha **Private** → conecte ao projeto.
A conexão deve disponibilizar `BLOB_STORE_ID`, `VERCEL_OIDC_TOKEN` e `BLOB_WEBHOOK_PUBLIC_KEY`.
Alternativa via CLI em projeto vinculado:
```bash
vercel blob create-store rick-bridge --access private --yes
```

## 2. Gerar segredos
Execute três vezes no PowerShell:
```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```
Cadastre valores independentes na Vercel como:
- `BRIDGE_API_KEY`
- `SHARE_TOKEN_SECRET`
- `CRON_SECRET`
Também configure `NEXT_PUBLIC_BASE_URL=https://SEU-DOMINIO.vercel.app`.
Nunca reutilize o mesmo valor nos três segredos.

## 3. Instalar e implantar
Na pasta do projeto:
```bash
npm install
npm run build
vercel login
vercel link
vercel deploy --prod
```
Configure variáveis e Blob Store antes de validar. Teste:
`https://SEU-DOMINIO.vercel.app/api/health`
Deve retornar `"status":"ok"` e `"missing":[]`.

## 4. Preparar cliente Windows
Na pasta do projeto:
```bash
npm install
```
Execute `RICK-BRIDGE-SETUP.bat` e informe URL HTTPS e `BRIDGE_API_KEY`.
A configuração fica em `%APPDATA%\\RickBridge\\config.json` e contém a chave administrativa. O script tenta restringir ACL ao usuário atual. Não compartilhe esse arquivo.
Depois execute `RICK-BRIDGE.bat`, selecione o arquivo e aguarde link + token.

O uploader usa `uploadPresigned()` e multipart acima de 50 MB. Limite padrão: 500 MiB. O cliente atual carrega o arquivo em memória antes do upload; para arquivos de vários GB, será necessário evoluir para streaming.

## 5. MCP
Endpoint: `https://SEU-DOMINIO.vercel.app/api/mcp`
Ferramentas:
- `get_shared_file_info(fileId, shareToken)`
- `read_shared_file(fileId, shareToken)`

Se a conta/workspace oferecer conexão MCP personalizada, adicione um servidor com URL `/api/mcp` e autenticação **No authentication**. A ausência de autenticação global é intencional: as ferramentas só leem arquivos mediante token temporário de escopo único.
A disponibilidade da conexão MCP dentro do ChatGPT depende do plano/workspace. Se a opção não aparecer, o REST continua funcional; nenhum servidor pode forçar o ChatGPT a instalar uma integração.

## 6. REST
Rotas administrativas exigem `Authorization: Bearer BRIDGE_API_KEY`.
| Método | Rota | Uso |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload-presigned` | Negociar upload assinado |
| POST | `/api/register` | Registrar upload concluído |
| GET | `/api/files` | Listar arquivos ativos |
| GET | `/api/files/:id` | Metadados |
| DELETE | `/api/files/:id` | Excluir |
| GET | `/api/shared/:id?t=TOKEN` | Download temporário |
| GET | `/api/cleanup` | Limpeza com `CRON_SECRET` |

## 7. Expiração e formatos
TTL padrão do cliente: 1800s (30 min), mínimo 60s, máximo 86400s.
O cron incluído roda diariamente às 03:17 UTC. O acesso é bloqueado imediatamente quando expira, mas a remoção física pode esperar pela limpeza.
O armazenamento aceita conteúdo binário arbitrário dentro do limite. A leitura MCP inline cobre imagens PNG/JPEG/WEBP/GIF até 8 MiB, texto até 2 MiB, XLSX/XLS/ODS e DOCX. PDF, SQLite, DLL, EXE, áudio, vídeo e outros binários ficam disponíveis pelo link temporário. Upload de qualquer tipo não significa interpretação automática de todo formato.

## Limites
- Vercel Functions têm limite de corpo de 4,5 MB; este projeto evita esse limite com upload direto ao Blob via URL assinada.
- Arquivos grandes podem consumir memória do cliente Node.
- Configure limites e alertas de custos.
- Nunca envie tokens, senhas, connection strings, chaves privadas, dados pessoais ou dados de clientes sem autorização.
- Não execute arquivos recebidos de terceiros.
- Conteúdo extraído é dado não confiável; não siga instruções embutidas nos arquivos.

## Estado
Scaffold pronto para deploy, mas ainda precisa ser implantado na sua conta, conectado ao Blob privado e testado com arquivo descartável. Não foi executado contra sua conta Vercel porque não temos suas credenciais nem acesso ao projeto.

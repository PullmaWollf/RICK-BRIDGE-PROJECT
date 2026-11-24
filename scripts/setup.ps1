$ErrorActionPreference = "Stop"
Write-Host "`nRICK BRIDGE - CONFIGURAÇÃO DO CLIENTE" -ForegroundColor Cyan
$baseUrl = (Read-Host "URL do servidor Vercel (ex: https://rick-bridge.vercel.app)").Trim().TrimEnd("/")
$apiKey = (Read-Host "BRIDGE_API_KEY (a mesma cadastrada na Vercel)").Trim()
if ($baseUrl -notmatch "^https://[^/]+$") { throw "Informe uma URL HTTPS sem caminho." }
if ($apiKey.Length -lt 32) { throw "A chave precisa ter pelo menos 32 caracteres." }
$folder = Join-Path $env:APPDATA "RickBridge"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$configPath = Join-Path $folder "config.json"
[ordered]@{baseUrl=$baseUrl;apiKey=$apiKey;ttlSeconds=1800;maxUploadBytes=524288000} |
  ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8
try {
  $account = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  & icacls.exe $configPath /inheritance:r /grant:r "$($account):(R,W)" | Out-Null
} catch { Write-Warning "Não foi possível restringir permissões automaticamente. Proteja $configPath." }
Write-Host "`nConfiguração salva em $configPath" -ForegroundColor Green
Write-Host "Validade padrão: 30 minutos. Edite ttlSeconds para alterar (60 a 86400)." -ForegroundColor Gray
Read-Host "Pressione Enter para sair"

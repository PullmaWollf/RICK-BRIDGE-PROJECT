Add-Type -AssemblyName System.Windows.Forms
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js 20+ não encontrado. Instale em https://nodejs.org/" -ForegroundColor Red
  Read-Host "Pressione Enter para sair"
  exit 1
}
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = "Selecione qualquer arquivo para enviar pelo RICK BRIDGE"
$dialog.Multiselect = $false
$dialog.CheckFileExists = $true
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host "Upload cancelado."
  exit 0
}
& node (Join-Path $PSScriptRoot "upload.mjs") $dialog.FileName
if ($LASTEXITCODE -ne 0) { Write-Host "`nO upload falhou." -ForegroundColor Red }
Read-Host "`nPressione Enter para fechar"

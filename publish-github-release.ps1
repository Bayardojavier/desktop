$ErrorActionPreference = 'Stop'

Write-Host "Publicar release (electron-builder) a GitHub" -ForegroundColor Cyan
Write-Host "- Este script NO imprime el token" -ForegroundColor DarkGray
Write-Host "- Requiere tener npm instalado y dependencias ya instaladas" -ForegroundColor DarkGray

# Pedir token sin eco
$secureToken = Read-Host -Prompt 'Pega tu GH_TOKEN (no se mostrara en pantalla)' -AsSecureString

# Convertir SecureString -> string (solo en memoria)
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($token)) {
  throw 'GH_TOKEN vacio. Cancelado.'
}

# Setear solo para este proceso
$env:GH_TOKEN = $token

try {
  # En Windows PowerShell, `npm` suele resolverse a npm.ps1.
  # npm.ps1 puede fallar bajo StrictMode (propiedad MyInvocation.Statement).
  # Forzamos el shim cmd para evitar ese problema.
  $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if (-not $npmCmd) { $npmCmd = 'npm.cmd' }

  Write-Host "Ejecutando: npm run publish:win" -ForegroundColor Yellow
  & $npmCmd run publish:win
  Write-Host "Listo. Revisa GitHub Releases del repo para confirmar el release." -ForegroundColor Green
} finally {
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  $token = $null
}

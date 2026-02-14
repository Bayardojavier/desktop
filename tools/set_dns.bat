@echo off
REM set_dns.bat
REM Cambia el DNS de todos los adaptadores de red activos a Cloudflare(1.1.1.1) y Google(8.8.8.8)
REM Requiere ejecutar como Administrador

echo ==================================================
echo Cambiando DNS a 1.1.1.1 / 8.8.8.8 en adaptadores activos
echo ==================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "
try {
  $adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty Name
  if (-not $adapters) { Write-Host 'No se encontraron adaptadores activos.'; exit 1 }
  foreach ($name in $adapters) {
    Write-Host "-> Configurando DNS en: $name"
    netsh interface ip set dns name=\"$name\" static 1.1.1.1
    netsh interface ip add dns name=\"$name\" 8.8.8.8 index=2
  }
  Write-Host 'DNS actualizado correctamente.'
} catch {
  Write-Host 'Error:' $_.Exception.Message
  exit 2
}
"

pause

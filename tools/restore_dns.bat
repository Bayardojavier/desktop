@echo off
REM restore_dns.bat
REM Restaura la configuración de DNS a DHCP en adaptadores de red activos
REM Requiere ejecutar como Administrador

echo ==================================================
echo Restaurando DNS a DHCP en adaptadores activos
echo ==================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "
try {
  $adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty Name
  if (-not $adapters) { Write-Host 'No se encontraron adaptadores activos.'; exit 1 }
  foreach ($name in $adapters) {
    Write-Host "-> Restaurando DHCP en: $name"
    netsh interface ip set dns name=\"$name\" dhcp
  }
  Write-Host 'DNS restaurado a DHCP correctamente.'
} catch {
  Write-Host 'Error:' $_.Exception.Message
  exit 2
}
"

pause

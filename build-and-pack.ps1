# Limpiar caché y carpeta dist
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue

# Construir solo win-unpacked (sin instalador, sin winCodeSign)
Write-Host "📦 Ejecutando: npm run dist -- --dir" -ForegroundColor Cyan
npm run dist -- --dir

# Verificar que se generó la app
if (-not (Test-Path "dist\win-unpacked")) {
    Write-Host "❌ Error: No se generó 'dist\win-unpacked'." -ForegroundColor Red
    pause
    exit 1
}

# Comprimir y enviar a Descargas
$zipPath = "$env:USERPROFILE\Downloads\Absolute de Nicaragua_Portable.zip"
Write-Host "🗜️  Creando ZIP en: $zipPath" -ForegroundColor Cyan
Compress-Archive -Path "dist\win-unpacked" -DestinationPath $zipPath -Force

Write-Host "✅ ¡Listo! App empaquetada en Descargas." -ForegroundColor Green
pause
$ErrorActionPreference = 'Stop'

$Bump = 'patch'
$DryRun = $false

for ($i = 0; $i -lt $args.Count; $i++) {
  $arg = "$($args[$i])"

  if ($arg -eq '-DryRun') {
    $DryRun = $true
    continue
  }

  if ($arg -eq '-Bump' -and ($i + 1) -lt $args.Count) {
    $candidate = "$($args[$i + 1])".ToLowerInvariant()
    if ($candidate -in @('patch', 'minor', 'major')) {
      $Bump = $candidate
    }
    $i++
    continue
  }

  $candidateImplicit = $arg.ToLowerInvariant()
  if ($candidateImplicit -in @('patch', 'minor', 'major')) {
    $Bump = $candidateImplicit
  }
}

function Get-NpmCmd {
  $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if (-not $npmCmd) { $npmCmd = 'npm.cmd' }
  return $npmCmd
}

$npm = Get-NpmCmd

Write-Host "Release Windows automatizado" -ForegroundColor Cyan
Write-Host "- Bump: $Bump" -ForegroundColor DarkGray
if ($DryRun) {
  Write-Host "- Modo: dry-run (no publica)" -ForegroundColor Yellow
}

Write-Host "1) Incrementando version ($Bump)..." -ForegroundColor Yellow
& $npm version $Bump --no-git-tag-version

if ($LASTEXITCODE -ne 0) {
  throw "Fallo al incrementar version"
}

Write-Host "2) Empaquetando Windows..." -ForegroundColor Yellow
& $npm run pack

if ($LASTEXITCODE -ne 0) {
  throw "Fallo empaquetando Windows"
}

if ($DryRun) {
  Write-Host "Dry-run completo. Se omitio la publicacion." -ForegroundColor Green
  exit 0
}

$tokenSetByScript = $false
if ([string]::IsNullOrWhiteSpace($env:GH_TOKEN)) {
  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if ($gh) {
    $ghToken = (& gh auth token 2>$null)
    if (-not [string]::IsNullOrWhiteSpace($ghToken)) {
      $env:GH_TOKEN = $ghToken
      $tokenSetByScript = $true
    }
  }
}

if ([string]::IsNullOrWhiteSpace($env:GH_TOKEN)) {
  throw "No se encontro GH_TOKEN. Define GH_TOKEN o autentica gh CLI con 'gh auth login'."
}

try {
  Write-Host "3) Publicando a GitHub Release..." -ForegroundColor Yellow
  & $npm run publish:win

  if ($LASTEXITCODE -ne 0) {
    throw "Fallo la publicacion en GitHub"
  }

  Write-Host "Release completado correctamente." -ForegroundColor Green
}
finally {
  if ($tokenSetByScript) {
    Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  }
}

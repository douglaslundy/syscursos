$ErrorActionPreference = "Stop"

$outPath = ".codex/context/PACK.md"
$lines = New-Object System.Collections.Generic.List[string]

$lines.Add("# Codex Context Pack")
$lines.Add("")
$lines.Add("## Git")

try { $lines.Add((git branch --show-current 2>$null)) } catch { $lines.Add("Nao detectado") }
try {
  $gitStatus = (git status --short 2>$null | Out-String).TrimEnd()
  if ([string]::IsNullOrWhiteSpace($gitStatus)) { $gitStatus = "Workspace limpo" }
  $lines.Add($gitStatus)
} catch {
  $lines.Add("Git nao detectado")
}

$lines.Add("")
$lines.Add("## Arquivos relevantes")

$root = (Get-Location).Path
$files = Get-ChildItem -Recurse -File | Where-Object {
  $_.FullName -notmatch "\\node_modules\\|\\.git\\|\\dist\\|\\build\\|\\.next\\"
} | Sort-Object FullName | Select-Object -First 300

foreach ($f in $files) {
  $relative = $f.FullName.Replace($root + "\", "./").Replace("\", "/")
  $lines.Add($relative)
}

$contextFiles = @(
  "AGENTS.md",
  "package.json",
  "README.md",
  ".env.example",
  ".codex/context/PROJECT_BRIEF.md",
  ".codex/context/ARCHITECTURE.md",
  ".codex/context/DECISIONS.md",
  ".codex/context/CURRENT_STATE.md",
  ".codex/context/COMMANDS.md",
  ".codex/context/GLOSSARY.md"
)

foreach ($path in $contextFiles) {
  if (Test-Path $path) {
    $lines.Add("")
    $lines.Add("--- $path ---")
    $lines.Add("")
    $lines.Add((Get-Content $path -Raw))
  }
}

Set-Content -Path $outPath -Value $lines -Encoding UTF8
Write-Output "Gerado: $outPath"

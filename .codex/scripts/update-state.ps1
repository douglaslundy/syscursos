$ErrorActionPreference = "Stop"

$branch = ""
try { $branch = (git branch --show-current 2>$null) } catch { $branch = "Nao detectado" }
if ([string]::IsNullOrWhiteSpace($branch)) { $branch = "Nao detectado" }

$lastCommit = ""
try { $lastCommit = (git log -1 --oneline 2>$null) } catch { $lastCommit = "Sem commit detectado" }
if ([string]::IsNullOrWhiteSpace($lastCommit)) { $lastCommit = "Sem commit detectado" }

$status = ""
try { $status = (git status --short 2>$null | Out-String).TrimEnd() } catch { $status = "Git nao detectado" }
if ([string]::IsNullOrWhiteSpace($status)) { $status = "Workspace limpo" }

$changed = ""
try { $changed = (git diff --name-only HEAD 2>$null | Out-String).TrimEnd() } catch { $changed = "" }
if ([string]::IsNullOrWhiteSpace($changed)) { $changed = "(nenhum arquivo alterado no diff com HEAD)" }

$content = @"
# Estado atual

Branch atual:
$branch

Ultimo commit:
$lastCommit

Arquivos modificados:
$status

Arquivos alterados recentemente:
$changed

Pendencias:
- Preencher contexto com base no codigo existente.
- Validar comandos oficiais.
- Registrar decisoes arquiteturais ja presentes no projeto.

Riscos:
- Contexto inicial pode estar incompleto.
- Algumas regras podem existir apenas implicitamente no codigo.
"@

Set-Content -Path ".codex/context/CURRENT_STATE.md" -Value $content -Encoding UTF8
Write-Output "Atualizado: .codex/context/CURRENT_STATE.md"

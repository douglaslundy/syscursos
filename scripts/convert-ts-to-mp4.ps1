<#
.SYNOPSIS
    Varre recursivamente um diretorio procurando arquivos .ts e gera um .mp4
    equivalente na mesma pasta, via remux (sem recodificar, rapido e sem perda).

.PARAMETER RootPath
    Pasta raiz a ser varrida recursivamente. Se nao for informado, usa a pasta
    onde este script esta salvo (permite copiar o .ps1 para dentro da pasta
    do curso e rodar sem argumentos).

.PARAMETER KeepOriginal
    Se informado, mantem o .ts original apos a conversao. Por padrao, o .ts
    e apagado assim que o .mp4 correspondente e confirmado com sucesso.

.PARAMETER WhatIf
    Se informado, apenas lista os arquivos que seriam convertidos, sem converter.

.EXAMPLE
    .\convert-ts-to-mp4.ps1
    (roda a partir da pasta onde o script esta salvo; apaga os .ts convertidos)

.EXAMPLE
    .\convert-ts-to-mp4.ps1 -RootPath "G:\Meu Drive\Aulas" -WhatIf

.EXAMPLE
    .\convert-ts-to-mp4.ps1 -KeepOriginal
#>
param(
    [string]$RootPath = $PSScriptRoot,

    [switch]$KeepOriginal,

    [switch]$WhatIf
)

if (-not (Test-Path $RootPath)) {
    Write-Error "Caminho nao encontrado: $RootPath"
    exit 1
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Error "ffmpeg nao encontrado no PATH. Reinicie o terminal apos a instalacao e tente novamente."
    exit 1
}

$tsFiles = Get-ChildItem -Path $RootPath -Recurse -Filter *.ts -File

if ($tsFiles.Count -eq 0) {
    Write-Host "Nenhum arquivo .ts encontrado em '$RootPath'."
    exit 0
}

Write-Host "Encontrados $($tsFiles.Count) arquivo(s) .ts."

$success = 0
$failed = 0
$skipped = 0

foreach ($file in $tsFiles) {
    $mp4Path = [System.IO.Path]::ChangeExtension($file.FullName, "mp4")

    if (Test-Path $mp4Path) {
        Write-Host "[PULADO] Ja existe: $mp4Path"
        $skipped++
        continue
    }

    if ($WhatIf) {
        Write-Host "[SERIA CONVERTIDO] $($file.FullName) -> $mp4Path"
        continue
    }

    Write-Host "[CONVERTENDO] $($file.FullName)"

    # -c copy = remux (nao recodifica). Se o .ts tiver codec incompativel
    # com mp4 (raro para H.264/AAC), ffmpeg retorna erro e o arquivo fica sem gerar.
    & ffmpeg -y -i $file.FullName -c copy -movflags +faststart $mp4Path -loglevel error

    if ($LASTEXITCODE -eq 0 -and (Test-Path $mp4Path)) {
        Write-Host "[OK] $mp4Path"
        $success++

        if (-not $KeepOriginal) {
            Remove-Item $file.FullName -Force
            Write-Host "[REMOVIDO ORIGINAL] $($file.FullName)"
        }
    }
    else {
        Write-Warning "[FALHOU] $($file.FullName) - tentando re-encode (codec pode ser incompativel com mp4)"

        & ffmpeg -y -i $file.FullName -c:v libx264 -c:a aac -movflags +faststart $mp4Path -loglevel error

        if ($LASTEXITCODE -eq 0 -and (Test-Path $mp4Path)) {
            Write-Host "[OK - RE-ENCODE] $mp4Path"
            $success++

            if (-not $KeepOriginal) {
                Remove-Item $file.FullName -Force
                Write-Host "[REMOVIDO ORIGINAL] $($file.FullName)"
            }
        }
        else {
            Write-Error "[FALHOU DEFINITIVAMENTE] $($file.FullName)"
            $failed++
        }
    }
}

Write-Host ""
Write-Host "Resumo: $success convertido(s), $skipped pulado(s), $failed falhou(aram)."

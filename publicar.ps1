# publicar.ps1 — publica uma nova versão do Sarandi Newsroom Dashboard
# Uso: .\publicar.ps1 [versão]
# Exemplos:
#   .\publicar.ps1          → incrementa o patch automaticamente (1.0.5 → 1.0.6)
#   .\publicar.ps1 1.1.0    → define a versão explicitamente

param(
    [string]$Versao = ""
)

Set-Location $PSScriptRoot

# Lê a versão atual do package.json
$versaoAtual = (Get-Content "package.json" -Raw | ConvertFrom-Json).version

# Determina a nova versão
if ($Versao -eq "") {
    $partes = $versaoAtual -split '\.'
    $patch = [int]$partes[2] + 1
    $Versao = "$($partes[0]).$($partes[1]).$patch"
}

Write-Host ""
Write-Host "Versão atual : $versaoAtual"
Write-Host "Nova versão  : $Versao"
Write-Host ""

$confirmacao = Read-Host "Confirma a publicação? (s/N)"
if ($confirmacao -notmatch '^[sS]$') {
    Write-Host "Publicação cancelada."
    Read-Host "Pressione Enter para fechar"
    exit 0
}

# Verifica se GH_TOKEN está disponível
if (-not $env:GH_TOKEN) {
    Write-Host ""
    Write-Host "ERRO: variável GH_TOKEN não encontrada." -ForegroundColor Red
    Write-Host "Defina o token antes de publicar:"
    Write-Host '  $env:GH_TOKEN = "ghp_seuTokenAqui"'
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# Atualiza a versão via npm (confiável, sem risco de BOM ou encoding)
Write-Host ""
npm version $Versao --no-git-tag-version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao atualizar a versão." -ForegroundColor Red
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# Confirma que o package.json foi atualizado corretamente
$versaoNova = (Get-Content "package.json" -Raw | ConvertFrom-Json).version
Write-Host "package.json atualizado para v$versaoNova"
Write-Host "Iniciando build e publicação..."
Write-Host ""

npm run release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Versão $versaoNova publicada com sucesso no GitHub Releases!" -ForegroundColor Green
    Write-Host "Os apps instalados detectarão a atualização em até ~30 min."
} else {
    Write-Host ""
    Write-Host "Falha na publicação (código $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "Revertendo package.json para v$versaoAtual..."
    npm version $versaoAtual --no-git-tag-version | Out-Null
}

Read-Host "Pressione Enter para fechar"

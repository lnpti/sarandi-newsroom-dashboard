# publicar.ps1 — commita, versiona e publica o Sarandi Newsroom Dashboard
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

# ── 1. Commit de mudanças pendentes ─────────────────────────────────────────
Write-Host ""
Write-Host "Verificando mudanças pendentes..."
git add -A
$pendente = git status --porcelain
if ($pendente) {
    Write-Host "Commitando código-fonte..."
    git commit -m "chore: atualização antes do release v$Versao"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao commitar." -ForegroundColor Red
        Read-Host "Pressione Enter para fechar"
        exit 1
    }
} else {
    Write-Host "Nenhuma mudança pendente."
}

# ── 2. Bump de versão ────────────────────────────────────────────────────────
Write-Host ""
npm version $Versao --no-git-tag-version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao atualizar a versão." -ForegroundColor Red
    Read-Host "Pressione Enter para fechar"
    exit 1
}

$versaoNova = (Get-Content "package.json" -Raw | ConvertFrom-Json).version
Write-Host "package.json atualizado para v$versaoNova"

git add package.json package-lock.json
git commit -m "chore: release v$versaoNova"

# ── 3. Push ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Enviando para o GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao enviar para o GitHub." -ForegroundColor Red
    Write-Host "Revertendo versão..."
    npm version $versaoAtual --no-git-tag-version | Out-Null
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# ── 4. Build e publicação ────────────────────────────────────────────────────
Write-Host ""
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
    Write-Host "O código já foi enviado ao GitHub mas o instalador não foi gerado."
    Write-Host "Rode 'npm run release' manualmente após corrigir o problema."
}

Read-Host "Pressione Enter para fechar"

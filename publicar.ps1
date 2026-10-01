# publicar.ps1 — commita, versiona e publica o dashboard (Sarandi, Cacique ou as duas)
# Uso: .\publicar.ps1 [versão] [-Estacao sarandi|cacique|todas]
# Exemplos:
#   .\publicar.ps1                        → pergunta a emissora, incrementa o patch (1.0.5 → 1.0.6)
#   .\publicar.ps1 1.1.0                  → pergunta a emissora, versão explícita
#   .\publicar.ps1 -Estacao cacique       → Cacique direto, sem perguntar, incrementa o patch
#   .\publicar.ps1 -Estacao todas         → Sarandi e Cacique, uma atrás da outra, mesma versão

param(
    [string]$Versao = "",
    [ValidateSet("", "sarandi", "cacique", "todas")]
    [string]$Estacao = ""
)

Set-Location $PSScriptRoot

# Se não veio pelo parâmetro, pergunta interativamente.
if ($Estacao -eq "") {
    Write-Host ""
    Write-Host "Qual emissora publicar?"
    Write-Host "  1) Sarandi"
    Write-Host "  2) Cacique"
    Write-Host "  3) Todas"
    $escolha = Read-Host "Escolha (1/2/3)"
    switch ($escolha.Trim()) {
        "1" { $Estacao = "sarandi" }
        "2" { $Estacao = "cacique" }
        "3" { $Estacao = "todas" }
        "sarandi" { $Estacao = "sarandi" }
        "cacique" { $Estacao = "cacique" }
        "todas" { $Estacao = "todas" }
        default {
            Write-Host "Opção inválida." -ForegroundColor Red
            Read-Host "Pressione Enter para fechar"
            exit 1
        }
    }
}

# Uma versão só, compartilhada entre as emissoras selecionadas — o
# package.json/git são o mesmo repositório de código pras duas.
$Estacoes = if ($Estacao -eq "todas") { @("sarandi", "cacique") } else { @($Estacao) }

# Lê a versão atual do package.json
$versaoAtual = (Get-Content "package.json" -Raw | ConvertFrom-Json).version

# Determina a nova versão
if ($Versao -eq "") {
    $partes = $versaoAtual -split '\.'
    $patch = [int]$partes[2] + 1
    $Versao = "$($partes[0]).$($partes[1]).$patch"
}

Write-Host ""
Write-Host "Emissora(s)  : $($Estacoes -join ', ')"
Write-Host "Versão atual : $versaoAtual"
Write-Host "Nova versão  : $Versao"
Write-Host ""

$confirmacao = Read-Host "Confirma a publicação? (s/N)"
if ($confirmacao -notmatch '^[sS]$') {
    Write-Host "Publicação cancelada."
    Read-Host "Pressione Enter para fechar"
    exit 0
}

# Pega o token do gh CLI já autenticado nesta máquina — evita ter que digitar
# ou (pior) salvar o token em algum arquivo. Só usa $env:GH_TOKEN manual como
# alternativa caso o gh não esteja instalado/logado.
if (-not $env:GH_TOKEN) {
    $ghCli = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghCli) {
        $ghToken = gh auth token 2>$null
        if ($LASTEXITCODE -eq 0 -and $ghToken) {
            $env:GH_TOKEN = $ghToken.Trim()
        }
    }
}

if (-not $env:GH_TOKEN) {
    Write-Host ""
    Write-Host "ERRO: nenhum token do GitHub disponível." -ForegroundColor Red
    Write-Host "Rode 'gh auth login' uma vez nesta máquina (fica salvo com segurança pelo gh),"
    Write-Host "ou defina manualmente antes de publicar:"
    Write-Host '  $env:GH_TOKEN = "ghp_seuTokenAqui"'
    Write-Host "Nunca salve o token dentro de um arquivo do repositório."
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# Cacique depende do Firecrawl pra notícias — a chave vem do .env local
# (nunca commitado) e é embutida no build. Sem o arquivo, o app empacotado
# não conseguiria buscar notícias.
if ($Estacoes -contains "cacique" -and -not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "ERRO: arquivo .env não encontrado (precisa de MAIN_VITE_FIRECRAWL_API_KEY)." -ForegroundColor Red
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

# ── 4. Build e publicação — uma vez por emissora selecionada ────────────────
# Cada emissora publica pro seu próprio repositório de release (ver
# electron-builder.config.js), então uma falha numa não deve impedir a outra.
$resultados = @{}
foreach ($est in $Estacoes) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " Publicando $est (v$versaoNova)..." -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""

    $env:STATION = $est
    npm run release
    $resultados[$est] = $LASTEXITCODE
}

# ── 5. Resumo ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Resumo da publicação v$versaoNova" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$algumaFalhou = $false
foreach ($est in $Estacoes) {
    if ($resultados[$est] -eq 0) {
        Write-Host " $est`: publicada com sucesso" -ForegroundColor Green
    } else {
        Write-Host " $est`: falha na publicação (código $($resultados[$est]))" -ForegroundColor Red
        $algumaFalhou = $true
    }
}

Write-Host ""
if (-not $algumaFalhou) {
    Write-Host "Os apps instalados detectarão a atualização em até ~30 min." -ForegroundColor Green
} else {
    Write-Host "O código já foi enviado ao GitHub. Pra emissora que falhou, rode:"
    Write-Host "  `$env:STATION = 'sarandi_ou_cacique'; npm run release"
    Write-Host "após corrigir o problema."
}

Read-Host "Pressione Enter para fechar"

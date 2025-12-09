# ═══════════════════════════════════════════════════════════════════════════════
#                    AÇAÍ DICASA - PAINEL DE GERENCIAMENTO
# ═══════════════════════════════════════════════════════════════════════════════
# Script de gerenciamento do servidor - Windows PowerShell
# ═══════════════════════════════════════════════════════════════════════════════

# Cores para o terminal
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║                                                                  ║" -ForegroundColor Magenta
    Write-Host "  ║" -ForegroundColor Magenta -NoNewline
    Write-Host "           🍇 AÇAÍ DICASA - PAINEL INTEGRATOR 🍇              " -ForegroundColor Cyan -NoNewline
    Write-Host "║" -ForegroundColor Magenta
    Write-Host "  ║                                                                  ║" -ForegroundColor Magenta
    Write-Host "  ║" -ForegroundColor Magenta -NoNewline
    Write-Host "              Sistema de Gerenciamento do Servidor              " -ForegroundColor Yellow -NoNewline
    Write-Host "║" -ForegroundColor Magenta
    Write-Host "  ║                                                                  ║" -ForegroundColor Magenta
    Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Show-Menu {
    Write-Host "  ┌──────────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                      OPÇÕES DISPONÍVEIS                          │" -ForegroundColor DarkGray
    Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "1" -NoNewline -ForegroundColor Green
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "🚀 Deploy Completo" -ForegroundColor White
    Write-Host "        " -NoNewline
    Write-Host "Build e inicia todos os containers" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "2" -NoNewline -ForegroundColor Green
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "📦 Build do Projeto Completo" -ForegroundColor White
    Write-Host "        " -NoNewline
    Write-Host "Build do Frontend + Backend (sem iniciar)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "3" -NoNewline -ForegroundColor Green
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "🎨 Build do Frontend" -ForegroundColor White
    Write-Host "        " -NoNewline
    Write-Host "Apenas build do React/Vite" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "4" -NoNewline -ForegroundColor Green
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "⚙️  Build do Backend" -ForegroundColor White
    Write-Host "        " -NoNewline
    Write-Host "Apenas build do Node.js/Express" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "5" -NoNewline -ForegroundColor Red
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "⏸️  Pausar Sistema" -ForegroundColor White
    Write-Host "        " -NoNewline
    Write-Host "Para todos os containers (docker-compose down)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host "  │                      OPÇÕES EXTRAS                               │" -ForegroundColor DarkGray
    Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "6" -NoNewline -ForegroundColor Cyan
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "📊 Status dos Containers" -ForegroundColor White
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "7" -NoNewline -ForegroundColor Cyan
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "📜 Ver Logs (tempo real)" -ForegroundColor White
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "8" -NoNewline -ForegroundColor Cyan
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "🔄 Reiniciar Sistema" -ForegroundColor White
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "9" -NoNewline -ForegroundColor Cyan
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "🗃️  Executar Migrations do Banco" -ForegroundColor White
    Write-Host ""
    Write-Host "    [" -NoNewline -ForegroundColor DarkGray
    Write-Host "0" -NoNewline -ForegroundColor Yellow
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "❌ Sair" -ForegroundColor White
    Write-Host ""
    Write-Host "  └──────────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Write-Host ""
}

function Show-Loading {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ⏳ " -NoNewline -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ""
}

function Show-Success {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ✅ " -NoNewline -ForegroundColor Green
    Write-Host $Message -ForegroundColor Green
    Write-Host ""
}

function Show-Error {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ❌ " -NoNewline -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    Write-Host ""
}

function Wait-ForKey {
    Write-Host ""
    Write-Host "  Pressione qualquer tecla para continuar..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Deploy-Complete {
    Show-Loading "Iniciando Deploy Completo..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose down 2>$null
    docker-compose up -d --build
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Deploy realizado com sucesso!"
        Write-Host ""
        Write-Host "  🌐 Frontend: " -NoNewline -ForegroundColor Cyan
        Write-Host "http://localhost:80" -ForegroundColor White
        Write-Host "  🔧 Backend:  " -NoNewline -ForegroundColor Cyan
        Write-Host "http://localhost:3001" -ForegroundColor White
        Write-Host "  🗄️  Database: " -NoNewline -ForegroundColor Cyan
        Write-Host "localhost:3307" -ForegroundColor White
    } else {
        Show-Error "Erro durante o deploy!"
    }
    Wait-ForKey
}

function Build-Project {
    Show-Loading "Iniciando Build do Projeto Completo..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose build
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Build do projeto completo realizado com sucesso!"
    } else {
        Show-Error "Erro durante o build!"
    }
    Wait-ForKey
}

function Build-Frontend {
    Show-Loading "Iniciando Build do Frontend..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose build frontend
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Build do Frontend realizado com sucesso!"
    } else {
        Show-Error "Erro durante o build do Frontend!"
    }
    Wait-ForKey
}

function Build-Backend {
    Show-Loading "Iniciando Build do Backend..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose build backend
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Build do Backend realizado com sucesso!"
    } else {
        Show-Error "Erro durante o build do Backend!"
    }
    Wait-ForKey
}

function Stop-System {
    Show-Loading "Pausando o Sistema..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Sistema pausado com sucesso!"
    } else {
        Show-Error "Erro ao pausar o sistema!"
    }
    Wait-ForKey
}

function Show-Status {
    Show-Loading "Verificando Status dos Containers..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host ""
    docker-compose ps
    Write-Host ""
    Wait-ForKey
}

function Show-Logs {
    Show-Loading "Exibindo Logs (Ctrl+C para sair)..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose logs -f
}

function Restart-System {
    Show-Loading "Reiniciando o Sistema..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose restart
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Sistema reiniciado com sucesso!"
    } else {
        Show-Error "Erro ao reiniciar o sistema!"
    }
    Wait-ForKey
}

function Run-Migrations {
    Show-Loading "Executando Migrations do Banco de Dados..."
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    docker-compose exec backend npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Migrations executadas com sucesso!"
    } else {
        Show-Error "Erro ao executar migrations!"
    }
    Wait-ForKey
}

# Loop Principal
do {
    Show-Header
    Show-Menu
    
    Write-Host "  Digite a opção desejada: " -NoNewline -ForegroundColor Yellow
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Deploy-Complete }
        "2" { Build-Project }
        "3" { Build-Frontend }
        "4" { Build-Backend }
        "5" { Stop-System }
        "6" { Show-Status }
        "7" { Show-Logs }
        "8" { Restart-System }
        "9" { Run-Migrations }
        "0" { 
            Write-Host ""
            Write-Host "  👋 Até logo!" -ForegroundColor Cyan
            Write-Host ""
            break 
        }
        default {
            Show-Error "Opção inválida! Tente novamente."
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")


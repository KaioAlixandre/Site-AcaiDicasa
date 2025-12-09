#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#                    AÇAÍ DICASA - PAINEL DE GERENCIAMENTO
# ═══════════════════════════════════════════════════════════════════════════════
# Script de gerenciamento do servidor - Linux/Unix Bash
# ═══════════════════════════════════════════════════════════════════════════════

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_header() {
    clear
    echo ""
    echo -e "  ${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "  ${MAGENTA}║${NC}                                                                  ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║${CYAN}           🍇 AÇAÍ DICASA - PAINEL INTEGRATOR 🍇              ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║${NC}                                                                  ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║${YELLOW}              Sistema de Gerenciamento do Servidor              ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}║${NC}                                                                  ${MAGENTA}║${NC}"
    echo -e "  ${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_menu() {
    echo -e "  ${GRAY}┌──────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${GRAY}│                      OPÇÕES DISPONÍVEIS                          │${NC}"
    echo -e "  ${GRAY}├──────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN}1${GRAY}] ${WHITE}🚀 Deploy Completo${NC}"
    echo -e "        ${GRAY}Build e inicia todos os containers${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN}2${GRAY}] ${WHITE}📦 Build do Projeto Completo${NC}"
    echo -e "        ${GRAY}Build do Frontend + Backend (sem iniciar)${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN}3${GRAY}] ${WHITE}🎨 Build do Frontend${NC}"
    echo -e "        ${GRAY}Apenas build do React/Vite${NC}"
    echo ""
    echo -e "    ${GRAY}[${GREEN}4${GRAY}] ${WHITE}⚙️  Build do Backend${NC}"
    echo -e "        ${GRAY}Apenas build do Node.js/Express${NC}"
    echo ""
    echo -e "    ${GRAY}[${RED}5${GRAY}] ${WHITE}⏸️  Pausar Sistema${NC}"
    echo -e "        ${GRAY}Para todos os containers (docker-compose down)${NC}"
    echo ""
    echo -e "  ${GRAY}├──────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "  ${GRAY}│                      OPÇÕES EXTRAS                               │${NC}"
    echo -e "  ${GRAY}├──────────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "    ${GRAY}[${CYAN}6${GRAY}] ${WHITE}📊 Status dos Containers${NC}"
    echo ""
    echo -e "    ${GRAY}[${CYAN}7${GRAY}] ${WHITE}📜 Ver Logs (tempo real)${NC}"
    echo ""
    echo -e "    ${GRAY}[${CYAN}8${GRAY}] ${WHITE}🔄 Reiniciar Sistema${NC}"
    echo ""
    echo -e "    ${GRAY}[${CYAN}9${GRAY}] ${WHITE}🗃️  Executar Migrations do Banco${NC}"
    echo ""
    echo -e "    ${GRAY}[${YELLOW}0${GRAY}] ${WHITE}❌ Sair${NC}"
    echo ""
    echo -e "  ${GRAY}└──────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

show_loading() {
    echo ""
    echo -e "  ${YELLOW}⏳${NC} ${CYAN}$1${NC}"
    echo ""
}

show_success() {
    echo ""
    echo -e "  ${GREEN}✅ $1${NC}"
    echo ""
}

show_error() {
    echo ""
    echo -e "  ${RED}❌ $1${NC}"
    echo ""
}

wait_for_key() {
    echo ""
    echo -e "  ${GRAY}Pressione ENTER para continuar...${NC}"
    read -r
}

deploy_complete() {
    show_loading "Iniciando Deploy Completo..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose down 2>/dev/null
    docker-compose up -d --build
    if [ $? -eq 0 ]; then
        show_success "Deploy realizado com sucesso!"
        echo ""
        echo -e "  ${CYAN}🌐 Frontend: ${WHITE}http://localhost:80${NC}"
        echo -e "  ${CYAN}🔧 Backend:  ${WHITE}http://localhost:3001${NC}"
        echo -e "  ${CYAN}🗄️  Database: ${WHITE}localhost:3307${NC}"
    else
        show_error "Erro durante o deploy!"
    fi
    wait_for_key
}

build_project() {
    show_loading "Iniciando Build do Projeto Completo..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose build
    if [ $? -eq 0 ]; then
        show_success "Build do projeto completo realizado com sucesso!"
    else
        show_error "Erro durante o build!"
    fi
    wait_for_key
}

build_frontend() {
    show_loading "Iniciando Build do Frontend..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose build frontend
    if [ $? -eq 0 ]; then
        show_success "Build do Frontend realizado com sucesso!"
    else
        show_error "Erro durante o build do Frontend!"
    fi
    wait_for_key
}

build_backend() {
    show_loading "Iniciando Build do Backend..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose build backend
    if [ $? -eq 0 ]; then
        show_success "Build do Backend realizado com sucesso!"
    else
        show_error "Erro durante o build do Backend!"
    fi
    wait_for_key
}

stop_system() {
    show_loading "Pausando o Sistema..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose down
    if [ $? -eq 0 ]; then
        show_success "Sistema pausado com sucesso!"
    else
        show_error "Erro ao pausar o sistema!"
    fi
    wait_for_key
}

show_status() {
    show_loading "Verificando Status dos Containers..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    docker-compose ps
    echo ""
    wait_for_key
}

show_logs() {
    show_loading "Exibindo Logs (Ctrl+C para sair)..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose logs -f
}

restart_system() {
    show_loading "Reiniciando o Sistema..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose restart
    if [ $? -eq 0 ]; then
        show_success "Sistema reiniciado com sucesso!"
    else
        show_error "Erro ao reiniciar o sistema!"
    fi
    wait_for_key
}

run_migrations() {
    show_loading "Executando Migrations do Banco de Dados..."
    echo -e "  ${GRAY}═══════════════════════════════════════════════════════════════${NC}"
    docker-compose exec backend npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        show_success "Migrations executadas com sucesso!"
    else
        show_error "Erro ao executar migrations!"
    fi
    wait_for_key
}

# Loop Principal
while true; do
    show_header
    show_menu
    
    echo -ne "  ${YELLOW}Digite a opção desejada: ${NC}"
    read -r choice
    
    case $choice in
        1) deploy_complete ;;
        2) build_project ;;
        3) build_frontend ;;
        4) build_backend ;;
        5) stop_system ;;
        6) show_status ;;
        7) show_logs ;;
        8) restart_system ;;
        9) run_migrations ;;
        0)
            echo ""
            echo -e "  ${CYAN}👋 Até logo!${NC}"
            echo ""
            exit 0
            ;;
        *)
            show_error "Opção inválida! Tente novamente."
            sleep 1
            ;;
    esac
done


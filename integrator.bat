@echo off
chcp 65001 >nul
title AÇAÍ DICASA - PAINEL INTEGRATOR
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0integrator.ps1"


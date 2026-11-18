@echo off
title My AI Video Studio Launcher
echo Starting FastAPI Backend...
start "AI Video Studio Backend" cmd /k "cd backend && pip install -r requirements.txt && python backend_server.py"
echo Starting React Frontend...
start "AI Video Studio Frontend" cmd /k "cd frontend && npm install && npm run dev"
echo Studio launched! Default Owner PIN: 2026
pause

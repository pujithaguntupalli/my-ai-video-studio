#!/usr/bin/env bash
set -e
echo "Starting FastAPI Backend..."
(cd backend && pip install -r requirements.txt && python3 backend_server.py) &
BACKEND_PID=$!
echo "Starting React Frontend..."
(cd frontend && npm install && npm run dev) &
FRONTEND_PID=$!
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
echo "My AI Video Studio is running! Default Owner PIN: 2026"
wait

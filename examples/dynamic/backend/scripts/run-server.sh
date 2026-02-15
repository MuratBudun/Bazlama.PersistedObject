#!/usr/bin/env bash

cd "$(dirname "$0")/.." || exit 1

if command -v python3 &>/dev/null; then
  PYTHON=python3
elif command -v python &>/dev/null; then
  PYTHON=python
else
  echo "Error: Python is not installed!"
  exit 1
fi

if [ ! -f ".venv/bin/activate" ]; then
  echo "Error: Virtual environment not found! Run setup.sh first"
  exit 1
fi

echo "Starting PersistedObject Dynamic Example API..."
echo "API:  http://localhost:8001"
echo "Docs: http://localhost:8001/docs"
echo "Press Ctrl+C to stop"
echo

source .venv/bin/activate
$PYTHON main.py

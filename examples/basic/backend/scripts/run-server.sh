#!/usr/bin/env bash

# Changes the current directory to the directory where this script is located
# This ensures the script runs from its own directory regardless of where it was called from
cd "$(dirname "$0")/.." || exit 1

# Detect Python command
if command -v python3 &>/dev/null; then
  PYTHON=python3
elif command -v python &>/dev/null; then
  PYTHON=python
else
  echo "Error: Python is not installed!"
  echo "Please install Python 3 first."
  exit 1
fi

if [ ! -f ".venv/bin/activate" ]; then
  echo "Error: Virtual environment not found!"
  echo "Please run setup.sh first"
  exit 1
fi

echo "Starting PersistedObject Example API... (using $PYTHON)"
echo
echo "API: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop the server"
echo

# shellcheck disable=SC1091
source .venv/bin/activate
$PYTHON main.py

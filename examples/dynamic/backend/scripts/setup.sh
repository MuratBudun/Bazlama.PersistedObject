#!/usr/bin/env bash

set -e

echo "========================================"
echo "PersistedObject Dynamic Example - Setup"
echo "========================================"
echo

cd "$(dirname "$0")/.." || exit 1

if command -v python3 &>/dev/null; then
  PYTHON=python3
elif command -v python &>/dev/null; then
  PYTHON=python
else
  echo "Error: Python is not installed!"
  exit 1
fi

echo "Using: $PYTHON ($($PYTHON --version 2>&1))"
echo

echo "Step 1: Creating virtual environment..."
if ! $PYTHON -m venv .venv; then
  echo "Error: Failed to create virtual environment"
  exit 1
fi
echo "Virtual environment created"

echo
echo "Step 2: Activating virtual environment..."
# shellcheck disable=SC1091
source .venv/bin/activate

echo
echo "Step 3: Installing persisted-object package..."
if ! pip install ../../../python; then
  echo "Error: Failed to install persisted-object"
  exit 1
fi
echo "persisted-object installed"

echo
echo "Step 4: Installing project dependencies..."
if ! pip install -e .; then
  echo "Error: Failed to install project dependencies"
  exit 1
fi
echo "Project dependencies installed"

echo
echo "Step 5: Creating database tables..."
if ! $PYTHON -c "from src.database import create_tables_sync; create_tables_sync()"; then
  echo "Error: Failed to create database tables"
  exit 1
fi
echo "Database tables created"

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "To start the server:"
echo "  ./scripts/run-server.sh"
echo

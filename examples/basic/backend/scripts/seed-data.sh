#!/usr/bin/env bash

set -e

echo "========================================"
echo "Seeding database with sample data..."
echo "========================================"
echo

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

# Activate virtual environment
# shellcheck disable=SC1091
source .venv/bin/activate

# Run seed script as module
$PYTHON -m src.seed_data

echo
echo "Seeding completed! You can now explore the example data."
echo "Run run-server.sh to start the API server."

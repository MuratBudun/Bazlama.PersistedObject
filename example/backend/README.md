# PersistedObject Example Backend

Example FastAPI application demonstrating the use of PersistedObject library.

## Project Structure

```
example/backend/
├── pyproject.toml          # Project configuration and dependencies
├── main.py                 # FastAPI application entry point
├── seed_data.py           # Database seeding script
├── .env                   # Environment variables (local)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── scripts/              # Utility scripts
│   ├── setup.bat         # Initial setup script (Windows)
│   ├── run-server.bat    # Quick start script (Windows)
│   └── seed-data.bat     # Seed database script (Windows)
└── src/                  # Source code package
    ├── __init__.py
    ├── database.py       # Database configuration
    ├── models.py         # Data models
    ├── encrypted_example.py  # Encryption example
    └── test_basic.py     # Basic tests
```

## Setup

### Quick Setup (Windows)

For Windows users, simply run:

```bash
.\scripts\setup.bat
```

This will:
1. Create virtual environment (.venv)
2. Install all dependencies
3. Set up the database

### Manual Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
# Install project with dependencies (includes pyproject.toml dependencies)
pip install -e .

# Install persisted-object from parent directory
pip install -e ../../backend
```

### 3. Configure Environment

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

## Running the Application

### Option 1: Using batch script (Windows)

```bash
.\scripts\run-server.bat
```

### Option 2: Direct command

```bash
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Seeding Database

To populate the database with sample data:

### Using batch script (Windows)

```bash
.\scripts\seed-data.bat
```

### Direct command

```bash
python seed_data.py
```

## Features Demonstrated

- Multiple column types (Boolean, Integer, DateTime, String)
- Automatic timestamps (created_at, updated_at)
- Composite unique constraints
- Array fields and nested data
- Optional JSON encryption (ApiKey model)
- Router Factory pattern (zero-boilerplate CRUD)
- Database session management
- CORS configuration for frontend development

## Models

- **AppSettings**: Key-value configuration store
- **Category**: Categories with boolean and integer fields
- **Tag**: Simple tags with usage counts
- **User**: Users with datetime fields
- **Project**: Projects with complex arrays
- **Event**: Events with datetime for date queries
- **ApiKey**: API keys with encrypted JSON
- **BlogPost**: Blog posts with rich content

## Development

### Running Tests

```bash
cd src
python -m test_basic
```

### Project Configuration

The project uses `pyproject.toml` for modern Python packaging:

- **Dependencies**: Listed in `[project.dependencies]`
- **Dev dependencies**: Listed in `[project.optional-dependencies]`
- **Package discovery**: Configured to find packages in `src/`

### Adding New Models

1. Define model in [src/models.py](src/models.py)
2. Register with `@register_persisted_model` decorator
3. Create store in [main.py](main.py)
4. Add router using `create_crud_router()`

## License

See LICENSE file in the root directory.

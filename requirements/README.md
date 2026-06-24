# Backend Scaffold

This folder contains an empty backend structure ready for implementation.

## Structure

- `app/main.py` - FastAPI application entrypoint
- `app/api/routes/` - API routes
- `app/services/` - Business logic services
- `app/models/` - Domain models
- `app/schemas/` - Request/response schemas
- `app/database/` - Database setup and sessions
- `app/core/` - Configuration
- `app/utils/` - Utility helpers

## Get started

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the app:

```bash
python -m uvicorn app.main:app --reload
```

Or use the provided PowerShell helper:

```powershell
./run.ps1
```

Run the test stub:

```powershell
./test.ps1
```

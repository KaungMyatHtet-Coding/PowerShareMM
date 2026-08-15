# PowerShare MM Backend API

This backend is an offline-capable FastAPI adapter over Person 1's pure
mathematical engine. It does not duplicate utility, equilibrium, uncertainty,
arbitration, or repeated-game formulas.

## Setup (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-api-dev.txt
```

Optional environment values can be copied from `.env.example`. The default
database is in-memory, which is suitable for the Monday demo and needs no
network service.

## Run

From the repository root:

```powershell
python -m uvicorn backend.app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the generated local API documentation.
The frontend development origin defaults to `http://localhost:5173`; set
`POWERSHARE_CORS_ORIGINS` to a comma-separated explicit allow-list when needed.

## Verify

```powershell
python -m pytest backend/tests/algorithms/ -q
python -m pytest backend/tests/api/ -q
git diff --check
```

The demo scenario is loaded into the local repository when the API starts.

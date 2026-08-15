# PowerShare MM frontend

This React/Vite dashboard renders the frozen V1.1 fixture or the authoritative FastAPI response. It does not calculate utilities, equilibria, uncertainty criteria, arbitration, or repeated-game scores in the browser.

```powershell
cd frontend
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run dev
```

Live mode posts to `POST /api/analysis/full`; configure `VITE_API_BASE_URL` in `.env`. Set `VITE_DEFAULT_MODE=mock` for an explicitly labeled offline fixture demo. Run the backend from the repository root with `python -m uvicorn backend.app.main:app --reload`. The UI uses no GPU, hardware control, cloud service, or runtime font CDN.

# Deploy THE EVIDENCE ROOM

Recommended split deployment:
- Frontend: Vercel (Vite static site)
- Backend: Render (FastAPI web service)

## 1. Deploy the API to Render

1. Push this repository to GitHub.
2. In Render, choose **New + → Blueprint** and select this repository.
3. Render detects `render.yaml`. Create the `the-evidence-room-api` service.
4. After deployment, copy the service URL, e.g. `https://the-evidence-room-api.onrender.com`.
5. In the Render service's Environment settings, set `CORS_ORIGINS` to the exact Vercel site URL once the frontend is deployed (for the first deployment, it can temporarily be `*` only if the API does not use credentialed browser requests; preferably set the Vercel URL).
6. Verify `https://YOUR-API.onrender.com/api/health` returns JSON.

## 2. Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Set Root Directory to `frontend`.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add Environment Variable `VITE_API_URL` with the Render API URL, without a trailing slash.
7. Deploy.
8. Copy the Vercel URL and set that exact URL in Render's `CORS_ORIGINS`, then redeploy the API.

## Important data note

The starter backend stores evidence-board saves in SQLite. Render's free service filesystem is ephemeral, so saved boards may be lost when the service restarts or redeploys. For durable public deployment, move board persistence to a managed PostgreSQL database or a persistent disk before relying on saved boards.

## Local frontend

From `frontend/` run `npm install` then `npm run dev`. Use the exact URL printed by Vite. The API defaults to `http://localhost:8000` unless `VITE_API_URL` is set.

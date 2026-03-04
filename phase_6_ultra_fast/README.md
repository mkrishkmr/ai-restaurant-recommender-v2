# AI Restaurant Recommender — Phase 6

Full-stack AI restaurant discovery app for Bangalore.

## Stack
- **Backend** (`/backend`): FastAPI + Pandas in-memory indexing + Gemini/Groq LLM
- **Frontend** (`/frontend`): Next.js 16 + Tailwind + Framer Motion

## Local Development

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your API keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# set BACKEND_URL=http://localhost:8000 in .env.local
npm run dev
```

## Deployment
- **Backend → Render**: Connect this repo, set root to `/backend`, add `GEMINI_API_KEY` + `GROQ_API_KEY` env vars
- **Frontend → Vercel**: Connect this repo, set root to `/frontend`, add `BACKEND_URL` pointing to your Render URL

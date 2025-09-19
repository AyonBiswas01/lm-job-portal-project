# LM-Powered Job Portal

This project is a hackathon-ready scaffold for a job portal that uses LLMs to extract skills and match candidates to jobs.

## Quick start

1. Backend:
   - `cd backend`
   - `npm install`
   - add `OPENAI_API_KEY` to `.env` if you want LLM explanations
   - `npm run init-db` (creates `jobs.db` with sample jobs)
   - `npm start`

2. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

3. Flow:
   - Visit Upload, upload a PDF resume → note candidate ID and preview text.
   - Visit Jobs, browse or search jobs.
   - Visit Results, enter candidate ID and click "Run Match" on a job to get score, skills, and explanation.

# Phase 2: NLP Intent Parsing Service

This folder will contain the code for the LLM Intent Parser. 
It establishes the Gemini 3 API integration to securely parse natural language user queries into validated JSON filters (`cuisine`, `location_canonical`, `min_rating`).

**Upcoming Tech Stack details:**
- Next.js Serverless Route OR standalone Node.js service
- Gemini 3 API SDK
- Zod (for JSON schema validation)

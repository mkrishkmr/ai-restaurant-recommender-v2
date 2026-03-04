"""
Phase 6: Ultra-Fast Restaurant Recommender Backend
FastAPI + Pandas in-memory indexing + Gemini (with Groq fallback)
"""

import os
import json
import asyncio
from functools import lru_cache
from typing import Optional

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from thefuzz import process as fuzz_process
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from groq import Groq

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# LLM Clients
# ─────────────────────────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY")) if os.getenv("GROQ_API_KEY") else None

# Gemini model fallback chain (tries each in order when rate-limited)
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


def _make_gemini(name: str) -> genai.GenerativeModel:
    return genai.GenerativeModel(
        model_name=name,
        generation_config=genai.GenerationConfig(response_mime_type="application/json"),
    )


async def _try_groq(prompt: str) -> str:
    """Call Groq llama-3.3-70b as the last-resort fallback."""
    if not groq_client:
        raise RuntimeError("GROQ_API_KEY not configured")
    response = await asyncio.to_thread(
        groq_client.chat.completions.create,
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful AI. Always respond with valid JSON only, no markdown."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
    )
    return response.choices[0].message.content


async def generate_with_fallback(prompt: str) -> str:
    """Tries Gemini models in order, then falls back to Groq if all are rate-limited."""
    last_err = None

    # Try Gemini models first
    for model_name in GEMINI_MODELS:
        try:
            model = _make_gemini(model_name)
            response = await asyncio.to_thread(model.generate_content, prompt)
            print(f"[LLM] Used Gemini: {model_name}")
            return response.text
        except ResourceExhausted as e:
            print(f"[LLM] {model_name} rate-limited, trying next...")
            last_err = e
        except Exception as e:
            print(f"[LLM] {model_name} error: {e}")
            last_err = e

    # Final fallback: Groq
    try:
        result = await _try_groq(prompt)
        print("[LLM] Used Groq fallback (llama-3.3-70b)")
        return result
    except Exception as e:
        print(f"[LLM] Groq also failed: {e}")
        raise RuntimeError(f"All LLM providers exhausted. Last Gemini error: {last_err}. Groq error: {e}")

# ─────────────────────────────────────────────────────────────────────────────
# STARTUP: Load the entire 71K-row CSV into memory ONE time
# ─────────────────────────────────────────────────────────────────────────────
CSV_PATH = os.getenv("CSV_PATH", "./data/zomato_slim.csv")

print(f"[BOOT] Loading dataset from: {CSV_PATH}")
df = pd.read_csv(
    os.path.join(os.path.dirname(__file__), CSV_PATH),
    usecols=["url", "name", "rating", "location", "cuisines"],
    dtype={"rating": str}
)

df["numeric_rating"] = (
    df["rating"].str.extract(r"([\d.]+)")[0].astype(float).fillna(0.0)
)
df["location"] = df["location"].fillna("").str.strip()
df["cuisines"] = df["cuisines"].fillna("").str.strip()
df["name"] = df["name"].fillna("").str.strip()

ALL_LOCATIONS = df["location"].dropna().unique().tolist()
print(f"[BOOT] Indexed {len(df):,} restaurants across {len(ALL_LOCATIONS)} locations.")

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Restaurant Recommender API", version="6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Fuzzy Location Resolver (cached)
# ─────────────────────────────────────────────────────────────────────────────
@lru_cache(maxsize=256)
def resolve_location(raw: str) -> Optional[str]:
    if not raw:
        return None
    result = fuzz_process.extractOne(raw, ALL_LOCATIONS, score_cutoff=60)
    return result[0] if result else None


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    query: str


class Restaurant(BaseModel):
    id: str
    name: str
    rating: float
    cuisines: list[str]
    location: str
    vibe_summary: str = ""


class RecommendResponse(BaseModel):
    active_filters: dict
    restaurants: list[Restaurant]


# ─────────────────────────────────────────────────────────────────────────────
# CALL 1: Parse user intent
# ─────────────────────────────────────────────────────────────────────────────
async def parse_intent(query: str) -> dict:
    prompt = f"""Extract restaurant search filters from this query and return ONLY valid JSON.
Return null for any filter not mentioned.

Query: "{query}"

Return this exact JSON structure:
{{
  "location": <string or null>,
  "cuisines": <array of strings or null>,
  "min_rating": <number or null>,
  "pure_veg": <boolean or null>
}}"""

    response_text = await generate_with_fallback(prompt)
    text = response_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ─────────────────────────────────────────────────────────────────────────────
# CALL 2: Batch vibe summaries in ONE prompt
# ─────────────────────────────────────────────────────────────────────────────
async def generate_vibes(restaurants: list[dict]) -> list[str]:
    if not restaurants:
        return []

    restaurant_list = "\n".join(
        f"{i+1}. {r['name']} in {r['location']} ({', '.join(r['cuisines'])}) - Rated {r['rating']}"
        for i, r in enumerate(restaurants)
    )

    prompt = f"""You are a culinary critic for Bangalore restaurants.
Write a punchy 1-sentence vibe summary for EACH restaurant based ONLY on their name, location, cuisine, and rating.
Do NOT mention the user's search. Be objective and enticing.

Restaurants:
{restaurant_list}

Return ONLY a JSON array of strings, one per restaurant in order:
["vibe for #1", "vibe for #2", ...]"""

    response_text = await generate_with_fallback(prompt)
    text = response_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/recommend", response_model=RecommendResponse)
async def recommend(body: RecommendRequest):
    query = body.query.strip()

    # Phase A: Parse intent
    filters = await parse_intent(query)

    # Phase B: Vectorized Pandas filter (microseconds on in-memory DataFrame)
    mask = pd.Series([True] * len(df), index=df.index)

    raw_loc = filters.get("location") or ""
    resolved_loc = resolve_location(raw_loc.lower()) if raw_loc else None
    if resolved_loc:
        mask &= df["location"].str.lower() == resolved_loc.lower()
        filters["location"] = resolved_loc

    cuisines = filters.get("cuisines") or []
    if cuisines:
        cuisine_pattern = "|".join(cuisines)
        mask &= df["cuisines"].str.contains(cuisine_pattern, case=False, na=False)

    min_rating = filters.get("min_rating")
    if min_rating:
        mask &= df["numeric_rating"] >= float(min_rating)

    # Always exclude restaurants with no rating data
    mask &= df["numeric_rating"] > 0

    # Apply mask, deduplicate by name (same restaurant can have many Zomato context URLs),
    # then sort by rating descending and take top 4
    filtered = df[mask].copy()
    filtered = filtered.drop_duplicates(subset=["name", "location"]).sort_values(
        "numeric_rating", ascending=False
    )
    top_rows = filtered.head(4)

    top_restaurants = [
        {
            "id": str(row["url"]),
            "name": row["name"],
            "rating": round(row["numeric_rating"], 1),
            "cuisines": [c.strip() for c in str(row["cuisines"]).split(",")][:3],
            "location": row["location"],
        }
        for _, row in top_rows.iterrows()
    ]

    # Phase C: One batch vibe call
    vibes = await generate_vibes(top_restaurants)

    restaurants_with_vibes = [
        Restaurant(**r, vibe_summary=vibes[i] if i < len(vibes) else "")
        for i, r in enumerate(top_restaurants)
    ]

    return RecommendResponse(active_filters=filters, restaurants=restaurants_with_vibes)


@app.get("/health")
async def health():
    return {"status": "ok", "rows_indexed": len(df)}

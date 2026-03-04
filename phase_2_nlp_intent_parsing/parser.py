import os
import json
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.example'))
api_key = os.getenv("GEMINI_API_KEY")

# Create the client globally
client = None
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)

# We define the structured output schema using Pydantic
class IntentFilters(BaseModel):
    is_unrelated: bool = Field(description="Set to true if the prompt has absolutely nothing to do with food, restaurants, eating out, or dining in Bangalore.")
    cuisines: Optional[List[str]] = Field(description="A list of cuisines mentioned (e.g., ['Asian', 'North Indian']). Leave null if none specified.")
    location: Optional[str] = Field(description="The canonical neighborhood or area in Bangalore mentioned (e.g. 'HSR Layout', 'Koramangala'). Leave null if none specified.")
    min_rating: Optional[float] = Field(description="The minimum numerical rating requested (e.g., 4.0, 4.5). Leave null if none specified.")
    pure_veg: Optional[bool] = Field(description="Set to true if the user strictly wants pure veg or vegetarian places. Leave null if not specified.")

def parse_intent(user_prompt: str) -> dict:
    """
    Parses a user's natural language string into structured JSON filters using Gemini.
    """
    if not client:
        return {
            "is_unrelated": False,
            "cuisines": None,
            "location": None,
            "min_rating": None,
            "pure_veg": None,
            "error": "Missing valid Gemini API key"
        }

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Extract filters from this query: '{user_prompt}'",
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an intent parser for a Bangalore Restaurant Recommendation engine. "
                    "Your job is to extract search filters from the user's natural language query into a strict JSON structure. "
                    "If the user query is completely unrelated to food/dining/restaurants (e.g., 'who won the match', 'tell me a joke'), "
                    "set is_unrelated to true and leave all other fields null. "
                    "If the query is relevant but provides limited information (e.g., 'get me food', 'places in Koramangala'), "
                    "only fill in the extracted fields (e.g., location='Koramangala') and leave the rest null (acting as open filters). "
                    "Always return valid JSON matching the schema."
                ),
                response_mime_type="application/json",
                response_schema=IntentFilters
            )
        )
        return json.loads(response.text)
    except Exception as e:
        # Fallback/Error state
        print(f"Error parsing intent: {e}")
        return {
            "is_unrelated": False,
            "cuisines": None,
            "location": None,
            "min_rating": None,
            "pure_veg": None,
            "error": str(e)
        }

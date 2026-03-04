import re

def normalize_location(location: str) -> str:
    """
    Normalizes Bangalore location strings to canonical forms.
    Handles fuzzy matches like "HSR", "Koramangala 5th Block", etc.
    """
    if not isinstance(location, str):
        return "Unknown"
    
    loc_lower = location.lower().strip()
    
    # Pre-defined mapping for popular Bangalore areas
    canonical_map = {
        "hsr": "HSR Layout",
        "hsr layout": "HSR Layout",
        "koramangala": "Koramangala",
        "kormangala": "Koramangala",
        "indiranagar": "Indiranagar",
        "jayanagar": "Jayanagar",
        "jp nagar": "JP Nagar",
        "whitefield": "Whitefield",
        "marathahalli": "Marathahalli",
        "malleshwaram": "Malleshwaram",
        "malleswaram": "Malleshwaram",
        "btm": "BTM Layout",
        "btm layout": "BTM Layout",
        "bannerghatta": "Bannerghatta Road",
        "bannerghatta road": "Bannerghatta Road",
        "electronic city": "Electronic City",
        "bellandur": "Bellandur",
        "sadashivanagar": "Sadashivanagar"
    }

    # Iterate through mapping to find substring matches
    # This handles "Koramangala 5th Block" -> "Koramangala" if desired, 
    # but for precision, we might just want to exact match or handle main areas
    for key, canonical in canonical_map.items():
        if key in loc_lower:
            return canonical
            
    # Fallback to title case of original if no canonical hit
    return location.title()


def normalize_cuisines(cuisines: str) -> list:
    """
    Normalizes a comma-separated string of cuisines into a clean list.
    """
    if not isinstance(cuisines, str) or not cuisines.strip():
        return []
    
    # Split by comma, strip whitespace, remove empty, and title case
    cleaned = [c.strip().title() for c in cuisines.split(",") if c.strip()]
    return cleaned

def clean_restaurant_data(df):
    """
    Cleans the raw Pandas DataFrame containing restaurant data.
    """
    # Create copy to avoid SettingWithCopyWarning
    df_clean = df.copy()
    
    # 1. Normalize Location
    if 'location' in df_clean.columns:
        df_clean['canonical_location'] = df_clean['location'].apply(normalize_location)
        
    # 2. Normalize Cuisines
    if 'cuisines' in df_clean.columns:
        df_clean['cuisines_list'] = df_clean['cuisines'].apply(normalize_cuisines)
        
    # 3. Handle Ratings (convert to float, handle 'NEW', '-', etc.)
    if 'rating' in df_clean.columns:
        def parse_rating(r):
            try:
                # E.g. "4.1/5" -> 4.1, or just "4.1"
                if isinstance(r, str):
                    r = r.split('/')[0].strip()
                return float(r)
            except (ValueError, AttributeError, TypeError):
                return None
        df_clean['numeric_rating'] = df_clean['rating'].apply(parse_rating)
        
    return df_clean

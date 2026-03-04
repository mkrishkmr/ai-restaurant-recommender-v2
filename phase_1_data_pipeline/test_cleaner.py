import pytest
import pandas as pd
from cleaner import normalize_location, normalize_cuisines, clean_restaurant_data

def test_normalize_location():
    # Exact Matches
    assert normalize_location("HSR Layout") == "HSR Layout"
    assert normalize_location("Indiranagar") == "Indiranagar"
    
    # Fuzzy / Substring Matches
    assert normalize_location("Koramangala 5th Block") == "Koramangala"
    assert normalize_location("Kormangala") == "Koramangala"
    assert normalize_location("hsr") == "HSR Layout"
    assert normalize_location("BTM 2nd Stage") == "BTM Layout"
    
    # Unmapped areas should return Title Case
    assert normalize_location("Frazer Town") == "Frazer Town"
    assert normalize_location("frazer town") == "Frazer Town"
    
    # Null / Invalid inputs
    assert normalize_location(None) == "Unknown"

def test_normalize_cuisines():
    # Regular comma separated
    assert normalize_cuisines("North Indian, Chinese, Fast Food") == ["North Indian", "Chinese", "Fast Food"]
    
    # Messy spacing
    assert normalize_cuisines(" Asian,  Desserts ,Beverages") == ["Asian", "Desserts", "Beverages"]
    
    # Empty or null
    assert normalize_cuisines("") == []
    assert normalize_cuisines(None) == []

def test_clean_restaurant_data():
    raw_data = {
        "name": ["Empire Restaurant", "Truffles", "New Place"],
        "location": ["Koramangala 5th Block", "hsr", "Unknown Area"],
        "cuisines": ["North Indian, Mughlai", "Cafe, American , Burgers", None],
        "rating": ["4.1/5", "4.5", "NEW"]
    }
    df = pd.DataFrame(raw_data)
    
    df_clean = clean_restaurant_data(df)
    
    # Check extra columns exist
    assert 'canonical_location' in df_clean.columns
    assert 'cuisines_list' in df_clean.columns
    assert 'numeric_rating' in df_clean.columns
    
    # Verify Location
    assert df_clean.iloc[0]['canonical_location'] == "Koramangala"
    assert df_clean.iloc[1]['canonical_location'] == "HSR Layout"
    
    # Verify Cuisines
    assert df_clean.iloc[0]['cuisines_list'] == ["North Indian", "Mughlai"]
    assert df_clean.iloc[1]['cuisines_list'] == ["Cafe", "American", "Burgers"]
    assert df_clean.iloc[2]['cuisines_list'] == []
    
    # Verify Ratings
    assert df_clean.iloc[0]['numeric_rating'] == 4.1
    assert df_clean.iloc[1]['numeric_rating'] == 4.5
    assert pd.isna(df_clean.iloc[2]['numeric_rating'])

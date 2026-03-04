import os
import pandas as pd
from datasets import load_dataset
from cleaner import clean_restaurant_data

def ingest_data():
    print("Downloading 'ManikaSaini/zomato-restaurant-recommendation' dataset...")
    
    try:
        # Load dataset from Hugging Face
        # The dataset might have splits like 'train'
        dataset = load_dataset("ManikaSaini/zomato-restaurant-recommendation")
        
        # Convert to Pandas DataFrame
        # Assumes training split is the main data
        if 'train' in dataset:
            df = dataset['train'].to_pandas()
        else:
            # Fallback to whatever split is available or just full data if direct
            first_split = list(dataset.keys())[0]
            df = dataset[first_split].to_pandas()
            
        print(f"Downloaded {len(df)} rows. Raw columns: {list(df.columns)}")
        
        print("Cleaning and normalizing data...")
        # Since column names in HuggingFace datasets can vary, let's map generic ones
        # common in zomato sets: 'name', 'location', 'cuisines', 'rate' or 'rating', 'rest_type', 'cost'
        
        # Standardize column names to lowercase
        df.columns = [c.lower() for c in df.columns]
        
        # Handle 'rate' vs 'rating'
        if 'rate' in df.columns and 'rating' not in df.columns:
            df.rename(columns={'rate': 'rating'}, inplace=True)
            
        df_clean = clean_restaurant_data(df)
        print("Cleaning complete. Data schema enriched.")
        
        # Filter for Bangalore if there is a city column, otherwise assume it's Bangalore data
        if 'city' in df_clean.columns:
            df_clean = df_clean[df_clean['city'].str.contains('Bangalore|Bengaluru', case=False, na=False)]
            
        # Display sample
        print("\n--- SAMPLE OF DOWNLOADED & CLEANED DATA (first 5 rows) ---")
        display_cols = ['name', 'canonical_location', 'cuisines_list', 'numeric_rating']
        
        # Make sure columns exist before display
        display_cols = [c for c in display_cols if c in df_clean.columns]
        print(df_clean[display_cols].head().to_string())
        
        # Save to local CSV for inspection/Phase 1 artifact
        out_path = os.path.join(os.path.dirname(__file__), "zomato_cleaned.csv")
        df_clean.to_csv(out_path, index=False)
        print(f"\nFinal cleaned dataset saved to: {out_path}")
        
    except Exception as e:
        print(f"Error during ingestion: {e}")

if __name__ == "__main__":
    ingest_data()

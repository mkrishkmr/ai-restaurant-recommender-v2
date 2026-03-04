import os
import pytest
from unittest.mock import patch, MagicMock
from parser import parse_intent

# We mock the Gemini API call so tests can run without hitting the real API or costing keys,
# while covering all our required "completely unrelated" and "limited info" edge cases.

@pytest.fixture
def mock_gemini():
    # We patch the module-level 'client' inside parser.py
    with patch('parser.client') as mock_client:
        yield mock_client

def test_full_information_query(mock_gemini):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = '{"is_unrelated": false, "cuisines": ["Asian"], "location": "HSR Layout", "min_rating": 4.0, "pure_veg": null}'
    mock_gemini.models.generate_content.return_value = mock_response

    result = parse_intent("Asian food near HSR above 4 stars")
    
    assert result['is_unrelated'] is False
    assert "Asian" in result['cuisines']
    assert result['location'] == "HSR Layout"
    assert result['min_rating'] == 4.0
    assert result['pure_veg'] is None

def test_limited_information_query(mock_gemini):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = '{"is_unrelated": false, "cuisines": null, "location": null, "min_rating": null, "pure_veg": null}'
    mock_gemini.models.generate_content.return_value = mock_response

    result = parse_intent("get me food")
    
    assert result['is_unrelated'] is False
    assert result['cuisines'] is None
    assert result['location'] is None
    assert result['min_rating'] is None

def test_partial_information_query(mock_gemini):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = '{"is_unrelated": false, "cuisines": ["South Indian"], "location": "Koramangala", "min_rating": null, "pure_veg": true}'
    mock_gemini.models.generate_content.return_value = mock_response

    result = parse_intent("pure veg south indian places in Koramangala")
    
    assert result['is_unrelated'] is False
    assert "South Indian" in result['cuisines']
    assert result['location'] == "Koramangala"
    assert result['pure_veg'] is True
    assert result['min_rating'] is None

def test_unrelated_query(mock_gemini):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = '{"is_unrelated": true, "cuisines": null, "location": null, "min_rating": null, "pure_veg": null}'
    mock_gemini.models.generate_content.return_value = mock_response

    result = parse_intent("who won the cricket match yesterday?")
    
    assert result['is_unrelated'] is True
    assert result['cuisines'] is None
    assert result['location'] is None
    assert result['min_rating'] is None
    assert result['pure_veg'] is None

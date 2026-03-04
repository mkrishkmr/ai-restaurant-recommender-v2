"""
Phase 6 Backend Tests
Tests the in-memory indexing, fuzzy matching, and API endpoints.
"""
import pytest
from fastapi.testclient import TestClient

# Import the app (this will trigger startup indexing)
from main import app, resolve_location, df

client = TestClient(app)


class TestStartupIndexing:
    def test_dataframe_loaded(self):
        """Verifies the CSV was loaded into memory on startup."""
        assert len(df) > 1000, "DataFrame should have many rows"

    def test_dataframe_has_required_columns(self):
        """Verifies all needed columns exist."""
        required = {"name", "location", "cuisines", "numeric_rating"}
        assert required.issubset(set(df.columns))


class TestFuzzyLocationMatching:
    def test_exact_match(self):
        """Confirms exact location string resolves correctly."""
        result = resolve_location("koramangala")
        assert result is not None
        assert "koramangala" in result.lower()

    def test_abbreviated_match(self):
        """Confirms abbreviation like 'hsr' resolves to full canonical form."""
        result = resolve_location("hsr")
        assert result is not None
        assert "hsr" in result.lower()

    def test_typo_tolerance(self):
        """Confirms minor typo is still resolved correctly."""
        result = resolve_location("indirangar")  # missing one 'a'
        assert result is not None

    def test_nonsense_input_returns_none(self):
        """Confirms garbage input returns None gracefully."""
        result = resolve_location("xyzabc123qwerty")
        assert result is None


class TestHealthEndpoint:
    def test_health_ok(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
        assert res.json()["rows_indexed"] > 0

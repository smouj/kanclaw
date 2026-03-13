import os

import pytest
import requests


@pytest.fixture(scope="session")
def base_url() -> str:
    """Base URL from environment for public endpoint testing."""
    value = os.environ.get("REACT_APP_BACKEND_URL")
    if not value:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return value.rstrip("/")


@pytest.fixture
def api_client() -> requests.Session:
    """Shared HTTP client for API tests."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
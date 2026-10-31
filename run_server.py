"""
Money Copilot - Main Application Entrypoint
Starts the AI Financial Intelligence Platform on http://127.0.0.1:8000
"""

import sys
import os
import uvicorn

# Ensure the root directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import init_db
from backend.services.seed_data import seed_database

if __name__ == "__main__":
    print("=" * 65)
    print("  MONEY COPILOT - AI FINANCIAL INTELLIGENCE PLATFORM")
    print("  Inspired by Cogniflow AI Analytics & Explainability Engine")
    print("=" * 65)
    
    print("[1/3] Initializing local persistent SQLite database (WAL mode)...")
    init_db()
    
    print("[2/3] Checking and seeding canonical demo data...")
    seed_database()
    
    print("[3/3] Starting enterprise FastAPI server at http://127.0.0.1:8000 ...")
    print("      API Docs available at: http://127.0.0.1:8000/docs")
    print("      Financial Dashboard at: http://127.0.0.1:8000/")
    print("=" * 65)
    
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=False)

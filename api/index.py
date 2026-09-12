from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_onions(images: list[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
        
    print(f"Received {len(images)} images for analysis.")
    
    # Simulate processing time
    time.sleep(2)
    
    # Mock YOLOv8 results for onion analysis matching QualityMetrics in types.ts
    seed = random.randint(1, 100)
    gradeA = 68 + (seed % 12)
    urs = 7 + (seed % 5)
    damaged = 4 + (seed % 3)
    rotten = 2 + (seed % 2)
    sprouted = 1 + (seed % 2)
    
    mock_results = {
        "status": "success",
        "analysis_id": f"batch_{random.randint(1000, 9999)}",
        "quality_metrics": {
            "gradeA": gradeA,
            "gradeB": 100 - gradeA - urs,
            "urs": urs,
            "damaged": damaged,
            "rotten": rotten,
            "sprouted": sprouted,
            "undersized": max(2, urs - damaged + 1),
            "avgSize": 48 + (seed % 8),
            "appearance": 86 + (seed % 9),
            "confidence": 92 + (seed % 6)
        }
    }
    
    return mock_results

import urllib.request
import json
from fastapi import HTTPException

@app.get("/api/market-rates")
async def get_market_rates():
    url = "https://mandi-api.onrender.com/v1/prices?commodity=Onion"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        
        regions = []
        seen_districts = set()
        
        # Define some top districts we care about if they exist, to put them first
        priority_districts = ["Nashik", "Pune", "Indore", "Bangalore", "Solapur", "Ahilyanagar"]
        
        for item in data.get("data", []):
            district = item.get("district", "")
            if district not in seen_districts:
                seen_districts.add(district)
                regions.append({
                    "id": district.lower(),
                    "name": f"{district}, {item.get('state', '')}",
                    "market": item.get("market", "").strip(),
                    "rate": round(item.get("modal_price", 0) / 100.0, 1)  # per kg
                })
        
        # Sort so priority districts are at the top, then alphabetically by name
        regions.sort(key=lambda r: (
            priority_districts.index(r["name"].split(',')[0]) if r["name"].split(',')[0] in priority_districts else 999,
            r["name"]
        ))
        
        # Return all distinct regions
        return {"status": "success", "data": regions}
    except Exception as e:
        print(f"Error fetching market rates: {e}")
        # Fallback data
        fallback = [
            { "id": 'nashik', "name": 'Nashik, Maharashtra', "market": 'Lasalgaon APMC', "rate": 31.5 },
            { "id": 'pune', "name": 'Pune, Maharashtra', "market": 'Pune Market Yard', "rate": 29.0 },
            { "id": 'indore', "name": 'Indore, Madhya Pradesh', "market": 'Choithram Mandi', "rate": 27.5 },
            { "id": 'bengaluru', "name": 'Bengaluru, Karnataka', "market": 'Yeshwanthpur APMC', "rate": 34.0 },
        ]
        return {"status": "error", "message": "Failed to fetch live rates, using fallback", "data": fallback}

@app.get("/")
def read_root():
    return {"message": "Onion Analysis Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

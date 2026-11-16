from __future__ import annotations
from pathlib import Path
from contextlib import contextmanager, asynccontextmanager
from typing import Optional
import json, os, sqlite3
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
DATA = BASE / "data"
DB_PATH = Path(os.getenv("EVIDENCE_ROOM_DB", str(BASE.parent / "evidence_room.sqlite3")))

def load_json(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))

CASES = load_json("cases.json")
FORENSICS = load_json("forensics.json")
SCENARIOS = load_json("scenarios.json")

@asynccontextmanager
async def lifespan(app: FastAPI):
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS boards (
            board_id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            board_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
    yield

app = FastAPI(
    title="The Evidence Room API",
    description="Research-first true-crime case archive, evidence workspace and fictional detective simulations.",
    version="2.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
origins = ["https://diahr0446-git.github.io", "https://the-evidence-room-tcel.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"] + os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in origins], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@contextmanager
def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()

class BoardPayload(BaseModel):
    case_id: str
    nodes: list[dict] = Field(default_factory=list)
    edges: list[dict] = Field(default_factory=list)
    notes: str = ""

def public_case(case: dict):
    return {k:v for k,v in case.items() if k not in ("sections","timeline","evidence","sources")}

@app.get("/")
def root():
    return {"name":"The Evidence Room API","version":"2.0.0","docs":"/docs","health":"/api/health"}

@app.get("/api/health")
def health():
    return {"status":"ok","service":"The Evidence Room API","version":"2.0.0","case_count":len(CASES)}

@app.get("/api/stats")
def stats():
    countries = {}
    for c in CASES:
        countries[c["country"]] = countries.get(c["country"], 0) + 1
    return {"case_count":len(CASES),"country_count":len(countries),"countries":countries,
            "unsolved_count":sum(c["status_type"]=="unsolved" for c in CASES),
            "source_count":sum(len(c["sources"]) for c in CASES),
            "categories":sorted({c["category"] for c in CASES})}

@app.get("/api/cases")
def list_cases(
    q: Optional[str] = Query(None, description="Search title, summary, location, tags and dossier text"),
    country: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    tag: Optional[str] = None,
    sort: str = "title",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    results = CASES
    if q:
        needle=q.casefold()
        results=[c for c in results if needle in " ".join([c["title"],c["subtitle"],c["summary"],c["country"],c["region"],c["category"]," ".join(c["tags"]), " ".join(c["sections"].values())]).casefold()]
    if country: results=[c for c in results if c["country"].casefold()==country.casefold()]
    if region: results=[c for c in results if region.casefold() in c["region"].casefold()]
    if status: results=[c for c in results if status.casefold() in c["status_type"].casefold() or status.casefold() in c["status"].casefold()]
    if category: results=[c for c in results if category.casefold() in c["category"].casefold()]
    if tag: results=[c for c in results if any(tag.casefold()==t.casefold() for t in c["tags"])]
    def start_year(c):
        import re
        m=re.search(r"(19|20)\d{2}",c["period"])
        return int(m.group()) if m else 0
    if year_from is not None: results=[c for c in results if start_year(c)>=year_from]
    if year_to is not None: results=[c for c in results if start_year(c)<=year_to]
    if sort=="newest": results=sorted(results,key=start_year,reverse=True)
    elif sort=="oldest": results=sorted(results,key=start_year)
    elif sort=="country": results=sorted(results,key=lambda c:(c["country"],c["title"]))
    else: results=sorted(results,key=lambda c:c["title"].casefold())
    total=len(results); start=(page-1)*page_size
    return {"total":total,"page":page,"page_size":page_size,"pages":(total+page_size-1)//page_size,
            "items":[public_case(c) for c in results[start:start+page_size]]}

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    c=next((x for x in CASES if x["id"]==case_id),None)
    if not c: raise HTTPException(404,"Case not found")
    return c

@app.get("/api/cases/{case_id}/timeline")
def get_timeline(case_id: str):
    c=next((x for x in CASES if x["id"]==case_id),None)
    if not c: raise HTTPException(404,"Case not found")
    return {"case_id":case_id,"items":c["timeline"]}

@app.get("/api/cases/{case_id}/evidence")
def get_evidence(case_id: str):
    c=next((x for x in CASES if x["id"]==case_id),None)
    if not c: raise HTTPException(404,"Case not found")
    return {"case_id":case_id,"items":c["evidence"]}

@app.get("/api/cases/{case_id}/sources")
def get_sources(case_id: str):
    c=next((x for x in CASES if x["id"]==case_id),None)
    if not c: raise HTTPException(404,"Case not found")
    return {"case_id":case_id,"items":c["sources"]}

@app.get("/api/search/suggest")
def suggest(q: str = Query(..., min_length=1)):
    needle=q.casefold()
    matches=[{"id":c["id"],"title":c["title"],"region":c["region"]} for c in CASES if needle in c["title"].casefold() or needle in c["region"].casefold()]
    return {"items":matches[:8]}

@app.get("/api/forensics")
def list_forensics():
    return {"count":len(FORENSICS),"items":FORENSICS}

@app.get("/api/forensics/{topic_id}")
def get_forensic(topic_id: str):
    f=next((x for x in FORENSICS if x["id"]==topic_id),None)
    if not f: raise HTTPException(404,"Forensic topic not found")
    return f

@app.get("/api/detective/scenarios")
def list_scenarios():
    return {"items":[{k:v for k,v in s.items() if k not in ("clues","answer","explanation")} for s in SCENARIOS]}

@app.get("/api/detective/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    s=next((x for x in SCENARIOS if x["id"]==scenario_id),None)
    if not s: raise HTTPException(404,"Scenario not found")
    return s

@app.get("/api/boards/{board_id}")
def get_board(board_id: str):
    with db() as con:
        row=con.execute("SELECT * FROM boards WHERE board_id=?",(board_id,)).fetchone()
    if not row: raise HTTPException(404,"Saved board not found")
    return {"board_id":row["board_id"],"case_id":row["case_id"],"updated_at":row["updated_at"],"board":json.loads(row["board_json"])}

@app.put("/api/boards/{board_id}")
def save_board(board_id: str, payload: BoardPayload):
    if not any(c["id"]==payload.case_id for c in CASES): raise HTTPException(404,"Case not found")
    serialized=json.dumps(payload.model_dump(),ensure_ascii=False)
    with db() as con:
        con.execute("""INSERT INTO boards(board_id,case_id,board_json,updated_at)
        VALUES(?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(board_id) DO UPDATE SET case_id=excluded.case_id,board_json=excluded.board_json,updated_at=CURRENT_TIMESTAMP""",
        (board_id,payload.case_id,serialized))
    return {"saved":True,"board_id":board_id,"case_id":payload.case_id}

@app.delete("/api/boards/{board_id}")
def delete_board(board_id: str):
    with db() as con:
        cur=con.execute("DELETE FROM boards WHERE board_id=?",(board_id,))
    if cur.rowcount==0: raise HTTPException(404,"Saved board not found")
    return {"deleted":True,"board_id":board_id}

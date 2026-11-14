# THE EVIDENCE ROOM — Studio Edition

**Every detail tells a story. Every piece of evidence matters.**

A cinematic, source-led true-crime archive and interactive investigation workspace. This is a substantially rebuilt version combining the strongest structure from both supplied ZIP projects, then expanding the dataset, API, UI and documentation.

## What changed in Studio Edition

The supplied archives were audited before rebuilding:

- `TheEvidenceRoom(1).zip` had the stronger foundation: React + TypeScript, Vite, FastAPI, React Flow, ten-part dossiers, timelines and forensic modules. Its main limitation was a five-case corpus and a relatively early prototype implementation.
- `evidence-room.zip` had a smaller React/React Flow prototype, a four-case dataset and a minimal API. It duplicated the case JSON between frontend and backend, making the data harder to maintain consistently.
- Studio Edition consolidates the corpus in the FastAPI backend, expands the archive to 41 dossiers, including 21 new international case files, introduces a ten-section common schema, richer search filters, source registers, case-status distinctions, a SQLite-backed evidence-board save endpoint, and a redesigned cinematic interface.

## Included case archive — 41 dossiers

### International cases
1. The Zodiac Killer
2. The Black Dahlia
3. The JonBenét Ramsey Case
4. D. B. Cooper Hijacking
5. The Hinterkaifeck Murders

### India — case files
6. Aarushi–Hemraj Case (Noida)
7. The Burari Deaths (Delhi)
8. The Nithari Killings (Noida)
9. Cyanide Mohan (Karnataka)
10. Cyanide Mallika (Karnataka)
11. Koodathayi Deaths / Jolly Joseph (Kerala)
12. Raman Raghav (Bombay / Mumbai)
13. The Stoneman Murders — Mumbai
14. The Stoneman Murders — Kolkata
15. The Jessica Lal Murder (Delhi)
16. The Sheena Bora Case (Mumbai)
17. Umesh Reddy (Karnataka)
18. The Priyadarshini Mattoo Case (Delhi)
19. Dhananjoy Chatterjee Case (Kolkata)
20. The Beer Man Murders (Mumbai)

The Stoneman Mumbai and Kolkata series are separate dossiers because a common offender has not been established. “Beer Man” refers to Ravindra Kantrole; he was convicted in one of three cases brought against him and acquitted in two others. The archive does not label him as convicted in all seven deaths sometimes discussed in media.


### International additions — ER-040 to ER-060
40. The Gabby Petito Case (United States)
41. The Junko Furuta Case (Japan)
42. The Murdaugh Family Murders (United States)
43. The Casey Anthony Trial (United States)
44. The O. J. Simpson Murder Trial (United States)
45. The Murder of Mia Zapata (United States)
46. The Rotenburg Cannibal Case (Germany)
47. The Josef Fritzl Case (Austria)
48. The Luka Magnotta Case (Canada)
49. The Hello Kitty Murder (Hong Kong)
50. The Issei Sagawa Case (France / Japan)
51. The Collyer Brothers Mystery (United States)
52. The Jonestown Massacre (Guyana)
53. The Tokyo Subway Sarin Attack (Japan)
54. The Heaven's Gate Mass Deaths (United States)
55. The NXIVM Sex Cult Scandal (United States)
56. The Sarah Lawrence Cult Case (United States)
57. The Altantuya Shaariibuu Murder (Malaysia)
58. The Sean 'Diddy' Combs Criminal Case (United States)
59. The Daphne Caruana Galizia Assassination (Malta)
60. The Duterte War on Drugs Investigation (Philippines / ICC)

## Each case has ten dossier sections

1. Case overview
2. Background and context
3. Chronology
4. Scene findings
5. Forensic evidence
6. Witness accounts
7. Investigative leads and persons of interest
8. Investigation review
9. Court / official outcome
10. Unanswered questions

Every dossier also includes a timeline, evidence-board starter nodes, case tags, source links, a status type and a last-researched date.

## Features

- Cinematic archive-room home page with original bundled SVG artwork.
- Search across case titles, summaries, tags, locations and dossier text.
- Filters for country, case status and category.
- Sorting by title, date and country.
- Case cards with bookmarks.
- Ten-section case dossiers with section navigation.
- Timeline view with evidence-status labels.
- Source register with outbound references.
- React Flow evidence board: drag, connect, rearrange and annotate.
- Notebook and saved board layouts (browser local storage plus API/SQLite persistence when backend is running).
- Fictional Detective Mode with clue inspection, multiple-choice reasoning and explanation.
- Forensic Lab with eight learning modules and explicit method limitations.
- FastAPI OpenAPI docs, health/stats endpoints, filtering, source, timeline and evidence endpoints.
- SQLite storage for saved evidence boards.

## Technology

- Frontend: React 18, TypeScript, Vite
- Styling: custom CSS design system
- Icons: Lucide React
- Evidence graph: `@xyflow/react`
- Backend: FastAPI + Pydantic
- Data: curated JSON corpus in one backend source of truth
- Saved boards: SQLite via Python standard library
- API documentation: OpenAPI / Swagger UI

## Run locally on macOS

### 1. Start FastAPI

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open API docs: http://localhost:8000/docs

### 2. Start the frontend

Open another terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints, normally http://localhost:5173.

The frontend defaults to `http://localhost:8000`. To override it:

```bash
cp .env.example .env
```

Then set `VITE_API_URL` in `frontend/.env`.

### 3. Check the API

```bash
curl http://localhost:8000/api/health
curl "http://localhost:8000/api/cases?q=Noida&page_size=100"
curl http://localhost:8000/api/cases/nithari-killings
curl http://localhost:8000/api/cases/nithari-killings/timeline
```

## API endpoint reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API overview |
| GET | `/api/health` | Health check and case count |
| GET | `/api/stats` | Archive counts and category summary |
| GET | `/api/cases` | Search, filter, sort and paginate cases |
| GET | `/api/cases/{case_id}` | Full dossier |
| GET | `/api/cases/{case_id}/timeline` | Chronology |
| GET | `/api/cases/{case_id}/evidence` | Evidence items |
| GET | `/api/cases/{case_id}/sources` | Source register |
| GET | `/api/search/suggest?q=...` | Search suggestions |
| GET | `/api/forensics` | Forensic modules |
| GET | `/api/forensics/{topic_id}` | One forensic module |
| GET | `/api/detective/scenarios` | Fictional scenario index |
| GET | `/api/detective/scenarios/{scenario_id}` | Full scenario and solution |
| GET | `/api/boards/{board_id}` | Retrieve saved board |
| PUT | `/api/boards/{board_id}` | Save board and notes to SQLite |
| DELETE | `/api/boards/{board_id}` | Delete saved board |

### Case search examples

```text
/api/cases?q=cyanide
/api/cases?country=India
/api/cases?country=India&status=unsolved
/api/cases?category=Homicide
/api/cases?year_from=2000&year_to=2020
/api/cases?tag=Cold%20case
/api/cases?sort=newest&page=1&page_size=12
```

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

Tests check API health, case count, India archive count, ten-section dossier completeness and the Nithari 2025 legal-status update.

## Research standards and important legal distinctions

This is an educational starter corpus, not an exhaustive evidentiary database or a substitute for legal advice. The data is deliberately source-aware:

- **Documented event** means a date or event supported by the listed source or a public record.
- **Prosecution allegation** means a claim made by investigators or prosecutors that has not necessarily been accepted by a court.
- **Court finding** means an outcome stated in a judgment.
- **Unresolved** means no conclusive public resolution is established in the cited material.
- **Reported / verify source** means the date or detail is not sufficiently firm to present as settled fact.

Some important distinctions encoded in the data:

- Nithari: the Supreme Court set aside Surendra Koli's final remaining conviction in its 11 November 2025 curative decision. Earlier reporting that described a pending conviction is outdated.
- Koodathayi / Jolly Joseph: as reported on 23 October 2026, the trial was ongoing and Joseph remained an undertrial. The dossier does not call her convicted.
- Aarushi–Hemraj: the Allahabad High Court acquitted Rajesh and Nupur Talwar in October 2017, overturning the 2013 trial-court conviction.
- Cyanide Mallika: outcomes differ across individual prosecutions. The Karnataka High Court acquitted her in the Elizabeth case in 2018; the archive does not flatten every allegation into a conviction.
- Beer Man: Kantrole was convicted in one of three cases and acquitted in two; the broader set of seven deaths is not represented as a proven series committed by him.
- Stoneman: Mumbai and Kolkata are kept separate because a single offender linking the two series has not been established.
- Sheena Bora: trial-status text reflects reporting in March 2026 and should be refreshed before public use.
- Umesh Reddy: the dossier describes the reported appellate and mercy proceedings through 2021 and flags that later legal status should be checked against current court records.

### Victim-centred and responsible use

Do not publish private addresses, contact details, identifying information about uninvolved people, graphic imagery, or unverified accusations. Avoid naming private individuals as suspects unless the public legal record requires it and the wording is carefully qualified. Do not turn a victim's suffering into entertainment. Detective Mode scenarios are fictional and must never be confused with real case files.

## Visual system

- Dark walnut / charcoal surfaces
- Aged paper and parchment evidence cards
- Muted brass and warm ivory typography
- Restrained oxblood accents for investigative connections
- Playfair Display editorial headlines, DM Sans body text, DM Mono metadata
- Original bundled vector artwork in `frontend/public/images/`
- The original design moodboard from the earlier project is preserved in `docs/` as a reference, not used as a live page background

## Project structure

```text
TheEvidenceRoom_Studio/
├── README.md
├── docker-compose.yml
├── docs/
│   ├── audit-and-data-notes.md
│   ├── visual-direction.md
│   └── evidence-room-original-moodboard.png
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── app/
│   │   ├── main.py
│   │   └── data/
│   │       ├── cases.json
│   │       ├── forensics.json
│   │       └── scenarios.json
│   └── tests/
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.example
    ├── public/images/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── styles.css
        └── types.ts
```

## Next milestones for a production version

1. Review every dossier against primary documents and add line/page-level citations for each claim.
2. Migrate the curated case corpus to PostgreSQL with editorial versioning.
3. Add user authentication, private notes and cloud-synced boards.
4. Build a source-ingestion and fact-checking workflow with human review.
5. Add richer fictional scenarios with branching logic and score history.
6. Add automated frontend tests, accessibility review, security headers and deployment configuration.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the recommended Vercel (frontend) + Render (FastAPI backend) deployment setup. A Render Blueprint is included as `render.yaml`; Vercel SPA routing is configured in `frontend/vercel.json`.

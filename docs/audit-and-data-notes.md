# ZIP audit and case-data notes

## Supplied archive comparison

### `TheEvidenceRoom(1).zip`
- 24 archive entries, roughly 2.66 MB uncompressed.
- React + TypeScript + Vite frontend.
- FastAPI backend with five structured cases.
- Ten-section dossiers, React Flow board, timeline, forensic modules.
- One generated moodboard image.
- Main gaps: small corpus; board state was not server-persisted; status and source metadata were relatively thin; no broad pagination/filter model.

### `evidence-room.zip`
- 15 archive entries, roughly 20 KB uncompressed.
- React + JSX + Vite and the older `reactflow` package.
- Four case records duplicated in frontend and backend JSON.
- Minimal API with only list and detail endpoints.
- Main gaps: duplicate data source, no robust filtering, no source register model, no complete dossier structure, very limited feature depth.

## Studio Edition decisions
- Adopt the newer TypeScript / Vite / FastAPI foundation.
- Keep one backend JSON source of truth for the corpus.
- Use one ten-section dossier schema for all 21 case files.
- Keep separate records for Mumbai and Kolkata Stoneman series.
- Preserve a distinct Beer Man dossier and explicitly represent the one conviction / two acquittals reported for Ravindra Kantrole.
- Use `status_type` plus human-readable `status` so UI and API can filter cases without collapsing complex legal histories.
- Provide source-register links, but mark dossiers as starter research that still requires primary-source review.
- Add SQLite-backed board persistence through the API.

## Known research limitations
This version prioritises correct legal distinctions and source transparency over sensational detail. Some case files have a limited number of timeline entries because the public references linked here do not support a longer precise chronology. Expand only after checking judgments, official releases and reliable contemporaneous reporting. The “last researched” field is a review date for this starter build, not a claim that every source was exhaustively re-audited on that date.

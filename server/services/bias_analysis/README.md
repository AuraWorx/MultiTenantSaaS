# Bias Analysis API Service

A robust FastAPI service for running bias analysis (AIF360) on uploaded files or folders.

## Features
- Upload a CSV/XLSX file or a ZIP folder of files
- Specify protected attribute and (optionally) group mappings
- Returns bias metrics as downloadable CSV

## Setup

```bash
cd server/services/bias_analysis
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## API Usage

### Analyze a Single File

```bash
curl -F "file=@yourdata.csv" "http://localhost:8000/analyze/file?protected_attribute=race"
```

- Optional: add `group_mappings` as a stringified dict, e.g.:
  `...&group_mappings={\"race\":{\"privileged\":[\"White\"],\"unprivileged\":[\"Black\",\"Asian\",\"Hispanic\"]}}`

### Analyze a Folder (ZIP)

```bash
curl -F "file=@yourfolder.zip" "http://localhost:8000/analyze/folder?protected_attribute=race"
```

## Response
- Always a CSV file with bias metrics (or error info)

## Notes
- Supported file types: .csv, .xlsx, .xls, .zip (for folders)
- Protected attribute must be a column in your data
- Group mappings are optional; if omitted, the service will auto-detect

## Example group_mappings

```
{"race": {"privileged": ["White"], "unprivileged": ["Black", "Asian", "Hispanic"]}}
```

## License
MIT 
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import json, csv, io
from typing import Optional

router = APIRouter()


class PasteRequest(BaseModel):
    text: str
    format: Optional[str] = "auto"


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), format: str = "auto"):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 text")
    return _parse(text, format)


@router.post("/paste")
async def paste_text(req: PasteRequest):
    return _parse(req.text, req.format or "auto")


def _parse(text: str, fmt: str) -> dict:
    detected = fmt
    rows_parsed, rows_valid = 0, 0
    errors, preview = [], []
    stripped = text.strip()
    if detected == "auto":
        if stripped.startswith("{") or stripped.startswith("["):
            detected = "prometheus_json"
        elif "plan_type" in text.lower() or "TabletCalls" in text:
            detected = "vtgate_queryz"
        elif "," in text and "\n" in text:
            detected = "metric_csv"
        else:
            detected = "unknown"
    if detected == "prometheus_json":
        try:
            data = json.loads(stripped)
            results = data if isinstance(data, list) else data.get("data", {}).get("result", [])
            rows_parsed = rows_valid = len(results)
            preview = results[:5]
        except Exception as e:
            errors.append(str(e))
    elif detected == "metric_csv":
        for row in csv.DictReader(io.StringIO(stripped)):
            rows_parsed += 1
            if all(row.values()):
                rows_valid += 1
                if len(preview) < 5:
                    preview.append(dict(row))
    elif detected == "vtgate_queryz":
        lines = [l.strip() for l in stripped.split("\n") if l.strip()]
        rows_parsed = len(lines)
        rows_valid = len([l for l in lines if len(l) > 10])
        preview = [{"raw_line": l} for l in lines[:5]]
    else:
        errors.append("Could not detect format.")
    return {
        "format_detected": detected, "rows_parsed": rows_parsed,
        "rows_valid": rows_valid, "errors": errors, "preview": preview,
        "analysis_id": f"import-{abs(hash(text)) % 999999:06d}",
        "message": f"Parsed {rows_valid} valid rows" if not errors else errors[0],
    }

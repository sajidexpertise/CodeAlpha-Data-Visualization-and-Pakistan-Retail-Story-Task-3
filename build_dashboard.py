"""Convert the CSV to an offline JavaScript data file for the interactive dashboard."""

import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
CSV = ROOT / "data" / "pakistan_retail_2023_2024.csv"
OUT = ROOT / "dashboard" / "data.js"


def main() -> None:
    if not CSV.exists():
        raise SystemExit("Dataset missing. Run: python generate_dataset.py")
    df = pd.read_csv(CSV)
    payload = df.to_dict(orient="records")
    OUT.write_text("window.RETAIL_DATA = " + json.dumps(payload, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Built {OUT} ({len(payload):,} records)")


if __name__ == "__main__":
    main()

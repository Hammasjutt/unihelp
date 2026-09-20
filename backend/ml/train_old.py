"""Train and evaluate UniHelp's department and priority text classifiers.

Examples from the repository root:

    python backend/ml/train.py
    python backend/ml/train.py --organization-id <uuid>
    python backend/ml/train.py --csv backend/ml/data/training_template.csv
"""

from __future__ import annotations

import argparse
import json
import math
import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

try:
    from .predict import build_ticket_text
except ImportError:
    from backend.ml.predict import build_ticket_text


REQUIRED_COLUMNS = {"title", "description", "category", "department", "priority"}
ALLOWED_PRIORITIES = {"Low", "Medium", "High"}
BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "models"


def load_env_file() -> None:
    for env_path in (BACKEND_DIR / ".env", Path.cwd() / ".env"):
        if not env_path.is_file():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            if key and key not in os.environ:
                os.environ[key] = value.strip().strip('"').strip("'")


def load_from_csv(csv_path: Path) -> pd.DataFrame:
    if not csv_path.is_file():
        raise FileNotFoundError(f"Training CSV not found: {csv_path}")
    return pd.read_csv(csv_path)


def load_from_supabase(organization_id: str | None = None) -> pd.DataFrame:
    load_env_file()
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env")

    from supabase import create_client

    client = create_client(supabase_url, service_role_key)
    rows: list[dict[str, Any]] = []
    page_size = 1000
    offset = 0
    while True:
        query = client.table("tickets").select("title,description,category,department,priority")
        if organization_id:
            query = query.eq("organization_id", organization_id)
        response = query.range(offset, offset + page_size - 1).execute()
        batch = response.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return pd.DataFrame(rows)


def prepare_training_data(frame: pd.DataFrame) -> pd.DataFrame:
    missing_columns = REQUIRED_COLUMNS.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Training data is missing columns: {', '.join(sorted(missing_columns))}")

    cleaned = frame[list(sorted(REQUIRED_COLUMNS))].copy()
    for column in REQUIRED_COLUMNS:
        cleaned[column] = cleaned[column].fillna("").astype(str).str.strip()
    cleaned["category"] = cleaned["category"].replace("", "General")
    cleaned["priority"] = cleaned["priority"].str.title()
    cleaned = cleaned[
        (cleaned["description"] != "")
        & (cleaned["department"] != "")
        & (cleaned["priority"].isin(ALLOWED_PRIORITIES))
    ].copy()
    cleaned["model_text"] = cleaned.apply(lambda row: build_ticket_text(row.to_dict()), axis=1)
    cleaned = cleaned.drop_duplicates(subset=["model_text", "department", "priority"]).reset_index(drop=True)
    if cleaned.empty:
        raise ValueError("No valid labeled tickets remain after cleaning")
    return cleaned


def validate_class_counts(values: pd.Series, target: str) -> dict[str, int]:
    counts = {str(label): int(count) for label, count in Counter(values).items()}
    if len(counts) < 2:
        raise ValueError(f"'{target}' needs at least two different labels; found {counts}")
    too_small = {label: count for label, count in counts.items() if count < 2}
    if too_small:
        raise ValueError(f"Every '{target}' label needs at least two examples; too small: {too_small}")
    return dict(sorted(counts.items()))


def make_pipeline() -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    min_df=1,
                    max_df=0.98,
                    max_features=30000,
                    strip_accents="unicode",
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )


def json_safe(value: Any) -> Any:
    return json.loads(json.dumps(value, default=lambda item: item.item()))


def train_target(texts: pd.Series, labels: pd.Series, target: str) -> tuple[Pipeline, dict[str, Any]]:
    label_counts = validate_class_counts(labels, target)
    class_count = len(label_counts)
    sample_count = len(labels)
    test_count = max(class_count, math.ceil(sample_count * 0.2))
    if sample_count - test_count < class_count:
        raise ValueError(
            f"Not enough '{target}' rows for a stratified train/test split. "
            f"Need at least two examples per label."
        )

    x_train, x_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=test_count,
        random_state=42,
        stratify=labels,
    )
    evaluation_model = make_pipeline()
    evaluation_model.fit(x_train, y_train)
    predictions = evaluation_model.predict(x_test)
    ordered_labels = sorted(label_counts)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "macro_f1": round(float(f1_score(y_test, predictions, average="macro", zero_division=0)), 4),
        "test_samples": int(len(y_test)),
        "labels": ordered_labels,
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=ordered_labels).tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=ordered_labels,
            output_dict=True,
            zero_division=0,
        ),
    }

    final_model = make_pipeline()
    final_model.fit(texts, labels)
    return final_model, json_safe(metrics)


def atomic_joblib_dump(model: Pipeline, destination: Path) -> None:
    temporary_path = destination.with_suffix(destination.suffix + ".tmp")
    joblib.dump(model, temporary_path)
    temporary_path.replace(destination)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train UniHelp ticket classifiers")
    parser.add_argument("--csv", type=Path, help="Read labeled tickets from a CSV instead of Supabase")
    parser.add_argument("--organization-id", help="Only use tickets belonging to one organization")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for model artifacts")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.csv and args.organization_id:
        raise ValueError("--organization-id only applies when loading tickets from Supabase")

    source = str(args.csv.resolve()) if args.csv else "supabase:tickets"
    raw_frame = load_from_csv(args.csv.resolve()) if args.csv else load_from_supabase(args.organization_id)
    training_data = prepare_training_data(raw_frame)

    department_counts = validate_class_counts(training_data["department"], "department")
    priority_counts = validate_class_counts(training_data["priority"], "priority")
    low_data_warnings = [
        f"{target} '{label}' has only {count} examples; aim for at least 50."
        for target, counts in (("department", department_counts), ("priority", priority_counts))
        for label, count in counts.items()
        if count < 50
    ]

    department_model, department_metrics = train_target(
        training_data["model_text"], training_data["department"], "department"
    )
    priority_model, priority_metrics = train_target(
        training_data["model_text"], training_data["priority"], "priority"
    )

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    atomic_joblib_dump(department_model, output_dir / "department_model.joblib")
    atomic_joblib_dump(priority_model, output_dir / "priority_model.joblib")

    metadata = {
        "model_version": 1,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "organization_id": args.organization_id,
        "training_rows": int(len(training_data)),
        "features": ["title", "description", "category"],
        "algorithm": "TF-IDF (1-2 grams) + Logistic Regression",
        "department_distribution": department_counts,
        "priority_distribution": priority_counts,
        "warnings": low_data_warnings,
        "metrics": {
            "department": department_metrics,
            "priority": priority_metrics,
        },
    }
    metadata_path = output_dir / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(json.dumps(metadata, indent=2))
    print(f"\nSaved trained models to: {output_dir}")


if __name__ == "__main__":
    main()

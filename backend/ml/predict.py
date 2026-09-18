"""Lazy-loading inference wrapper for the locally trained ticket classifier."""

from __future__ import annotations

import json
import os
from pathlib import Path
from threading import Lock
from typing import Any, Iterable


ALLOWED_PRIORITIES = {"Low", "Medium", "High"}
DEFAULT_MODEL_DIR = Path(__file__).resolve().parent / "models"


class ModelUnavailableError(RuntimeError):
    """Raised when the trained model artifacts have not been created yet."""


class ModelPredictionError(RuntimeError):
    """Raised when a model result is invalid or too uncertain to use."""


def build_ticket_text(payload: dict[str, Any]) -> str:
    """Build the exact structured text representation used during training."""
    title = " ".join(str(payload.get("title") or "").split())
    description = " ".join(str(payload.get("description") or "").split())
    category = " ".join(str(payload.get("category") or "General").split())
    return f"title: {title}\ncategory: {category}\ndescription: {description}".strip()


class LocalTicketClassifier:
    """Loads both sklearn pipelines once and returns validated predictions.

    Models are deliberately loaded lazily so the API can still start before the
    first training run. In that state, the caller can continue to n8n and then
    the keyword classifier.
    """

    def __init__(self, model_dir: Path | str | None = None, min_confidence: float | None = None):
        configured_dir = model_dir or os.getenv("ML_MODEL_DIR") or DEFAULT_MODEL_DIR
        self.model_dir = Path(configured_dir).expanduser().resolve()
        configured_threshold = min_confidence if min_confidence is not None else os.getenv("ML_MIN_CONFIDENCE", "0.45")
        try:
            self.min_confidence = float(configured_threshold)
        except (TypeError, ValueError) as exc:
            raise ValueError("ML_MIN_CONFIDENCE must be a number between 0 and 1") from exc
        if not 0 <= self.min_confidence <= 1:
            raise ValueError("ML_MIN_CONFIDENCE must be between 0 and 1")

        self._department_model: Any | None = None
        self._priority_model: Any | None = None
        self._metadata: dict[str, Any] = {}
        self._load_lock = Lock()

    @property
    def department_model_path(self) -> Path:
        return self.model_dir / "department_model.joblib"

    @property
    def priority_model_path(self) -> Path:
        return self.model_dir / "priority_model.joblib"

    @property
    def metadata_path(self) -> Path:
        return self.model_dir / "metadata.json"

    @property
    def is_available(self) -> bool:
        return self.department_model_path.is_file() and self.priority_model_path.is_file()

    @property
    def metadata(self) -> dict[str, Any]:
        if self.metadata_path.is_file() and not self._metadata:
            try:
                self._metadata = json.loads(self.metadata_path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                return {}
        return dict(self._metadata)

    def _ensure_loaded(self) -> None:
        if self._department_model is not None and self._priority_model is not None:
            return
        if not self.is_available:
            raise ModelUnavailableError(
                "Local model artifacts are missing. Run `python backend/ml/train.py` first."
            )

        with self._load_lock:
            if self._department_model is not None and self._priority_model is not None:
                return
            try:
                import joblib

                self._department_model = joblib.load(self.department_model_path)
                self._priority_model = joblib.load(self.priority_model_path)
            except Exception as exc:
                self._department_model = None
                self._priority_model = None
                raise ModelUnavailableError(f"Could not load local model artifacts: {exc}") from exc

    @staticmethod
    def _predict_with_confidence(model: Any, text: str) -> tuple[str, float]:
        if not hasattr(model, "predict") or not hasattr(model, "predict_proba"):
            raise ModelPredictionError("Model artifact does not support probability predictions")
        try:
            prediction = str(model.predict([text])[0])
            probabilities = model.predict_proba([text])[0]
            classes: Iterable[Any] = model.classes_
            probability_by_class = {
                str(label): float(probability)
                for label, probability in zip(classes, probabilities)
            }
            confidence = probability_by_class[prediction]
        except Exception as exc:
            raise ModelPredictionError(f"Local model prediction failed: {exc}") from exc
        return prediction, confidence

    def predict(self, payload: dict[str, Any], department_names: list[str]) -> dict[str, Any]:
        if not department_names:
            raise ModelPredictionError("No departments are available for validation")

        self._ensure_loaded()
        text = build_ticket_text(payload)
        department, department_confidence = self._predict_with_confidence(self._department_model, text)
        priority, priority_confidence = self._predict_with_confidence(self._priority_model, text)

        available_departments = {name.casefold(): name for name in department_names}
        validated_department = available_departments.get(department.casefold())
        if not validated_department:
            raise ModelPredictionError(
                f"Model predicted department '{department}', which is not configured for this organization"
            )

        validated_priorities = {name.casefold(): name for name in ALLOWED_PRIORITIES}
        validated_priority = validated_priorities.get(priority.casefold())
        if not validated_priority:
            raise ModelPredictionError(f"Model predicted unsupported priority '{priority}'")

        confidence = min(department_confidence, priority_confidence)
        if confidence < self.min_confidence:
            raise ModelPredictionError(
                f"Local model confidence {confidence:.3f} is below the configured threshold "
                f"of {self.min_confidence:.3f}"
            )

        return {
            "department": validated_department,
            "priority": validated_priority,
            "source": "local_model",
            "confidence": round(confidence, 4),
            "department_confidence": round(department_confidence, 4),
            "priority_confidence": round(priority_confidence, 4),
        }


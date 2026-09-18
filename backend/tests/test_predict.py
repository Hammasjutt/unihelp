from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from backend.ml.predict import (
    LocalTicketClassifier,
    ModelPredictionError,
    ModelUnavailableError,
    build_ticket_text,
)


class FakeProbabilityModel:
    def __init__(self, prediction: str, alternative: str, confidence: float):
        self.prediction = prediction
        self.classes_ = [prediction, alternative]
        self.confidence = confidence

    def predict(self, _texts):
        return [self.prediction]

    def predict_proba(self, _texts):
        return [[self.confidence, 1 - self.confidence]]


def ready_classifier(department: str = "IT Support", confidence: float = 0.9) -> LocalTicketClassifier:
    classifier = LocalTicketClassifier(model_dir="/tmp/unused-unihelp-models", min_confidence=0.45)
    classifier._department_model = FakeProbabilityModel(department, "Facilities", confidence)
    classifier._priority_model = FakeProbabilityModel("High", "Medium", confidence)
    return classifier


class LocalTicketClassifierTests(unittest.TestCase):
    def test_structured_text_contains_all_model_inputs(self):
        text = build_ticket_text(
            {"title": " WiFi down ", "description": " Cannot connect ", "category": " IT "}
        )
        self.assertEqual(text, "title: WiFi down\ncategory: IT\ndescription: Cannot connect")

    def test_missing_artifacts_raise_model_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            classifier = LocalTicketClassifier(model_dir=Path(directory))
            with self.assertRaises(ModelUnavailableError):
                classifier.predict({"description": "wifi issue"}, ["IT Support"])

    def test_prediction_is_validated_case_insensitively(self):
        classifier = ready_classifier(department="it support")
        result = classifier.predict({"description": "wifi is down"}, ["IT Support", "Facilities"])
        self.assertEqual(result["department"], "IT Support")
        self.assertEqual(result["priority"], "High")
        self.assertEqual(result["source"], "local_model")
        self.assertEqual(result["confidence"], 0.9)

    def test_unknown_organization_department_is_rejected(self):
        classifier = ready_classifier(department="Library")
        with self.assertRaises(ModelPredictionError):
            classifier.predict({"description": "book issue"}, ["IT Support", "Facilities"])

    def test_low_confidence_is_rejected_for_fallback(self):
        classifier = ready_classifier(confidence=0.4)
        with self.assertRaises(ModelPredictionError):
            classifier.predict({"description": "ambiguous issue"}, ["IT Support", "Facilities"])


if __name__ == "__main__":
    unittest.main()


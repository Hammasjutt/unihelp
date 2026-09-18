from __future__ import annotations

import unittest

import pandas as pd

from backend.ml.train_old import prepare_training_data, train_target


class TrainingTests(unittest.TestCase):
    def test_cleaning_normalizes_and_deduplicates_rows(self):
        frame = pd.DataFrame(
            [
                {
                    "title": "WiFi",
                    "description": "Internet down",
                    "category": "",
                    "department": "IT Support",
                    "priority": "high",
                },
                {
                    "title": "WiFi",
                    "description": "Internet down",
                    "category": "",
                    "department": "IT Support",
                    "priority": "high",
                },
            ]
        )
        cleaned = prepare_training_data(frame)
        self.assertEqual(len(cleaned), 1)
        self.assertEqual(cleaned.iloc[0]["category"], "General")
        self.assertEqual(cleaned.iloc[0]["priority"], "High")

    def test_training_returns_metrics_and_probability_model(self):
        texts = pd.Series(
            [
                "wifi network down",
                "portal login broken",
                "internet password reset",
                "classroom fan broken",
                "washroom has no water",
                "air conditioner repair",
                "fee voucher query",
                "payment not updated",
                "challan generation issue",
            ]
        )
        labels = pd.Series(
            [
                "IT Support",
                "IT Support",
                "IT Support",
                "Facilities",
                "Facilities",
                "Facilities",
                "Student Finance",
                "Student Finance",
                "Student Finance",
            ]
        )
        model, metrics = train_target(texts, labels, "department")
        self.assertTrue(hasattr(model, "predict_proba"))
        self.assertIn("accuracy", metrics)
        self.assertEqual(metrics["labels"], ["Facilities", "IT Support", "Student Finance"])


if __name__ == "__main__":
    unittest.main()


# Trained model artifacts

Run `python backend/ml/train.py` from the project root to create:

- `department_model.joblib`
- `priority_model.joblib`
- `metadata.json`

The API loads these files lazily. If they are absent, invalid, predict an unavailable
department, or return confidence below `ML_MIN_CONFIDENCE`, classification continues
to n8n and then the keyword fallback.


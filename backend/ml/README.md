# UniHelp local ticket classifier

The backend classification order is:

1. Local trained model
2. n8n AI webhook
3. Keyword fallback

## Training from Supabase

The default command reads final labels from the `tickets` table using the service-role
credentials already configured in `backend/.env`:

```bash
python backend/ml/train.py
```

For a model limited to one tenant:

```bash
python backend/ml/train.py --organization-id YOUR_ORGANIZATION_UUID
```

## Training from CSV

```bash
python backend/ml/train.py --csv /absolute/path/to/tickets.csv
```

Required columns are `title`, `description`, `category`, `department`, and `priority`.
The script removes invalid/duplicate rows, performs stratified evaluation, prints
accuracy, macro F1, per-label metrics and confusion matrices, then fits final models
on all cleaned rows.

Every label needs at least two examples for the evaluation split. The script warns
when a department or priority has fewer than 50 examples. Real corrected tickets are
strongly preferred over the small format example in `data/training_template.csv`.

## Runtime configuration

- `ML_MODEL_DIR`: optional custom artifact directory
- `ML_MIN_CONFIDENCE`: minimum confidence for both predictions; default `0.45`

After training, restart the FastAPI backend so the next request loads the new models.


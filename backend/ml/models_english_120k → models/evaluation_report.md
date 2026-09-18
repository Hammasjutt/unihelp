# UniHelp NLP Model Evaluation

- Training rows: **120,000**
- Departments: **6**
- Algorithm: **TF-IDF (1-2 grams) + Logistic Regression**
- Strict department accuracy (unseen scenarios): **92.49%**
- Strict department macro F1: **92.60%**
- Strict priority accuracy (unseen scenarios): **59.17%**
- Conventional random-split department accuracy: **100.00%**
- Conventional random-split priority accuracy: **100.00%**

The strict score holds two complete complaint scenarios per department out of training. It is the more conservative estimate for new wording. Random-split scores are included for comparison but can be optimistic for generated data.

## Per-department strict results

| Department | Precision | Recall | F1 | Test rows |
|---|---:|---:|---:|---:|
| Academic Office | 79.35% | 100.00% | 88.49% | 4000 |
| Facilities | 93.92% | 98.08% | 95.95% | 4000 |
| Hostel Management | 100.00% | 93.83% | 96.81% | 4000 |
| IT Support | 99.77% | 88.10% | 93.57% | 4000 |
| Student Finance | 99.80% | 87.02% | 92.98% | 4000 |
| Student Services | 87.73% | 87.92% | 87.83% | 4000 |

## Dataset distribution

| Department | Rows |
|---|---:|
| Academic Office | 20,000 |
| Facilities | 20,000 |
| Hostel Management | 20,000 |
| IT Support | 20,000 |
| Student Finance | 20,000 |
| Student Services | 20,000 |

## Interpretation

This is a synthetic multilingual baseline, not a claim of production accuracy. Replace or supplement generated examples with staff-corrected real tickets and retrain periodically. Priority labels are especially easy in this dataset because their urgency language is explicit.

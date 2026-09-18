# UniHelp NLP Model Evaluation

- Training rows: **12,000**
- Departments: **6**
- Algorithm: **TF-IDF (1-2 grams) + Logistic Regression**
- Strict department accuracy (unseen scenarios): **75.92%**
- Strict department macro F1: **74.22%**
- Strict priority accuracy (unseen scenarios): **100.00%**
- Conventional random-split department accuracy: **100.00%**
- Conventional random-split priority accuracy: **100.00%**

The strict score holds two complete complaint scenarios per department out of training. It is the more conservative estimate for new wording. Random-split scores are included for comparison but can be optimistic for generated data.

## Per-department strict results

| Department | Precision | Recall | F1 | Test rows |
|---|---:|---:|---:|---:|
| Academic Office | 53.62% | 100.00% | 69.81% | 400 |
| Facilities | 98.28% | 100.00% | 99.13% | 400 |
| Hostel Management | 73.80% | 100.00% | 84.93% | 400 |
| IT Support | 94.65% | 70.75% | 80.97% | 400 |
| Student Finance | 100.00% | 31.25% | 47.62% | 400 |
| Student Services | 76.16% | 53.50% | 62.85% | 400 |

## Dataset distribution

| Department | Rows |
|---|---:|
| Academic Office | 2,000 |
| Facilities | 2,000 |
| Hostel Management | 2,000 |
| IT Support | 2,000 |
| Student Finance | 2,000 |
| Student Services | 2,000 |

## Interpretation

This is a synthetic multilingual baseline, not a claim of production accuracy. Replace or supplement generated examples with staff-corrected real tickets and retrain periodically. Priority labels are especially easy in this dataset because their urgency language is explicit.

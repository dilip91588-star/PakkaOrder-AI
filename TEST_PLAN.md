# OrderTruth AI --- Test and Evaluation Plan

## 1. Testing layers

-   Unit tests: normalization, item matching, scoring, conflict
    detection, resolution policy.
-   API tests: request validation, authentication, tenant isolation,
    status codes.
-   Database integration tests: constraints, transactions, rollback,
    idempotency, concurrency.
-   AI contract tests: schema validation, missing/ambiguous values,
    prompt injection resilience.
-   UI tests: review flow, conflict display, decision confirmation,
    stale-state handling.
-   End-to-end tests: ingest → match → review → resolve → audit.

## 2. Essential fixtures

Create synthetic records for: 1. Exact duplicate ingestion event. 2.
Same order represented by WhatsApp and POS with same quantities. 3. Same
order with quantity 2 versus 3 due to a confirmed customer update. 4.
Two separate orders from the same customer to the same address within
five minutes. 5. Same product with different size or customization. 6.
Similar names for different products. 7. Same external order ID with
changed content. 8. Missing phone/address. 9. Same address with
different customers. 10. Similar orders belonging to different tenants.
11. Duplicate webhook delivered more than once. 12. Concurrent
resolution attempts. 13. AI extraction with missing/ambiguous quantity.
14. AI output with invalid schema or invented catalog ID. 15. Database
error halfway through resolution.

## 3. Safety assertions

-   No material conflict is automatically merged.
-   Duplicate quantities are never added together.
-   Source payload is preserved after normalization and resolution.
-   Every canonical change has a corresponding audit event.
-   Pending decision leaves canonical data unchanged.
-   Separate decision keeps records distinct.
-   Update decision requires an explicit approved value and reason.
-   Cross-tenant candidate matching is prohibited.
-   Stale versions fail with a conflict response.
-   Failed transaction leaves no partial link/candidate/conflict
    updates.
-   AI-generated IDs must exist in the tenant's catalog.
-   Missing data is not silently treated as a match.

## 4. Metrics

Use labelled examples with a documented annotation policy.

-   Precision = true positive duplicate candidates / all candidates
    predicted duplicate.
-   Recall = true positive duplicate candidates / all actual duplicate
    pairs in the labelled set.
-   False-merge rate = incorrect merges / all executed merges.
-   Field extraction exact-match accuracy for quantities, products, and
    key fields.
-   Conflict detection precision/recall.
-   Human review time per case.
-   Rate of cases deferred because evidence is insufficient.

Report sample size, class balance, test split, thresholds, and
limitations. A heuristic match score is not a calibrated probability.

## 5. Demo scenario

1.  Import WhatsApp source record with two paneer rolls and one cold
    coffee.
2.  Import POS source record with three paneer rolls and one cold
    coffee.
3.  Show candidate and quantity conflict.
4.  Open side-by-side review.
5.  Confirm the customer changed the quantity to three, using a clearly
    documented demo decision.
6.  Show canonical quantity = three.
7.  Show original source quantities remain two and three.
8.  Show both source links and audit history.
9.  Demonstrate that a separate order from the same customer is not
    merged.
10. Demonstrate stale-version handling with two simulated reviewers.

Use synthetic data only in the demo.

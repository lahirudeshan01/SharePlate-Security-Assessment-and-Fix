# Finding 01: BOLA/IDOR in donation request listing

## Classification

- OWASP API1:2023 Broken Object Level Authorization (BOLA)
- CWE-639: Authorization Bypass Through User-Controlled Key
- Severity: High

## Vulnerability in the original application

`GET /api/requests/donation/:donationId` accepted any authenticated user and
used the caller-controlled `donationId` directly in `Request.find`. The
handler did not verify that the authenticated user owned the donation. An
attacker with a valid account could replace `donationId` with another donor's
ID and read the associated shelter names, email addresses, request messages,
quantities, and statuses.

The original route also had no role restriction beyond authentication.

## Remediation

The handler now performs an ownership query using both the requested object ID
and the authenticated user's ID:

```js
await Donation.findOne({ _id: donationId, donor: req.user._id });
```

If the donation is missing or belongs to another user, the API returns `404`
and does not query or disclose any request data. The route is additionally
restricted to `donor` and `restaurant` roles, which matches its intended use.

## Verification

The unit test suite verifies that:

- an owner can list requests for their donation;
- a non-owner receives `404`; and
- `Request.find` is not called for an unauthorized object.

Run from `backend/`:

```bash
npm test -- --runInBand tests/unit/requestController.test.js
```

Result: 15 tests passed.

## Residual scope

This finding covers this endpoint only. Other ID-based endpoints should be
reviewed separately and must apply the same object-level authorization rule.
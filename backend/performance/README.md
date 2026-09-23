# Performance Testing with Artillery

This folder contains load test scenarios for the SharePlate backend API.

## What is covered

The suite simulates mixed traffic to measure latency and error behavior under concurrent load:
- `GET /api/health` for baseline throughput
- `POST /api/auth/register` with dynamic test users
- `GET /api/auth/me` with captured JWT tokens
- `POST /api/auth/login` after registration

## Prerequisites

1. Install backend dependencies:
   npm install
2. Start the backend server:
   npm run dev
3. Ensure MongoDB is running and reachable by the backend.

## Run commands

Run from `backend/`:

- Light load profile:
  npm run perf:light
- Medium load profile:
  npm run perf:medium
- Heavy load profile:
  npm run perf:heavy

Target another host with the CLI target override:
- PowerShell example:
  npx artillery run -t "http://127.0.0.1:5000" --environment medium performance/artillery.yml

## Generate report files

1. Run with JSON output:
   npm run perf:report
2. Generate HTML report:
   npm run perf:report:html

Generated files:
- `performance/reports/perf-report.json`
- `performance/reports/perf-report.html`

## Notes for accurate measurements

- The API has rate limiting by default. For stress tests, raise limits or disable temporarily:
  - `RATE_LIMIT_ENABLED=false`, or
  - set high values for `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`.
- Keep email provider credentials unset in performance environments to avoid external email latency affecting results.
- Use a non-production database for load testing.

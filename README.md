# SharePlate — Food Donation Management Platform

> **Connecting restaurants with shelters to reduce food waste and feed communities — one plate at a time.**

SharePlate is a full-stack web application that enables food donors (restaurants, individuals) to share surplus food with shelters and communities in need. The platform supports donation management, request handling, pickup scheduling, delivery tracking, and email notifications.

**Live Application:**
- Frontend: [https://shareplate-theta.vercel.app](https://shareplate-theta.vercel.app/)
- Backend API: [https://shareplate-urz2.onrender.com](https://shareplate-urz2.onrender.com)

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [API Endpoint Documentation](#2-api-endpoint-documentation)
3. [Deployment Report](#3-deployment-report)
4. [Testing Instruction Report](#4-testing-instruction-report)

---

## 1. Setup Instructions

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB** (local instance or MongoDB Atlas cloud cluster)
- **Git**

### 1.1 Clone the Repository

```bash
git clone https://github.com/lahirudeshan01/SharePlate.git
cd SharePlate
```

### 1.2 Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/shareplate
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (optional — for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

Start the backend server:

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

The backend runs on **http://localhost:5000** by default.

### 1.3 Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend runs on **http://localhost:5173** by default.

### 1.4 Project Structure

```
SharePlate/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # DB, email, Swagger config
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/             # Auth, validation, error handling
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/                # API route definitions
│   │   ├── utils/                 # Response handlers, token utils
│   │   └── validators/            # Input validators
│   ├── tests/                     # Unit & integration tests
│   ├── performance/               # Artillery performance tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   ├── pages/                 # Page-level components
│   │   ├── services/              # API service layer
│   │   └── main.jsx               # App entry point
│   └── package.json
└── README.md
```

---

## 2. API Endpoint Documentation

**Base URL:** `https://shareplate-urz2.onrender.com/api` (production) or `http://localhost:5000/api` (local)

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### 2.1 Health Check

| Method | Endpoint       | Auth | Description          |
|--------|---------------|------|----------------------|
| GET    | `/api/health` | No   | API health check     |

**Response:**
```json
{ "status": "ok" }
```

---

### 2.2 Authentication (`/api/auth`)

#### POST `/api/auth/register` — Register a New User

- **Auth:** None
- **Roles created:** `donor`, `shelter`, `manager`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "donor",
  "organizationName": "Food Bank NGO"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

#### POST `/api/auth/login` — Login

- **Auth:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

#### GET `/api/auth/profile` — Get Logged-in User Profile

- **Auth:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "organizationName": "Food Bank NGO"
  }
}
```

---

#### PUT `/api/auth/updatepassword` — Update Password

- **Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### 2.3 Donations (`/api/donations`)

#### POST `/api/donations` — Create a Donation

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant`

**Request Body:**
```json
{
  "foodName": "Rice",
  "quantity": 10,
  "expiryDate": "2026-03-01",
  "location": {
    "address": "123 Main St",
    "lat": 6.9271,
    "lng": 79.8612
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Donation created successfully",
  "donation": {
    "_id": "64def456...",
    "foodName": "Rice",
    "quantity": 10,
    "expiryDate": "2026-03-01T00:00:00.000Z",
    "status": "available",
    "donor": "64abc123...",
    "location": {
      "address": "123 Main St",
      "lat": 6.9271,
      "lng": 79.8612
    }
  }
}
```

---

#### GET `/api/donations/available` — Get Available Donations (Public)

- **Auth:** None

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "donations": [
    {
      "_id": "64def456...",
      "foodName": "Rice",
      "quantity": 10,
      "expiryDate": "2026-03-01T00:00:00.000Z",
      "status": "available",
      "donor": { "name": "John Doe", "organizationName": "Food Bank" }
    }
  ]
}
```

---

#### GET `/api/donations/public` — Get All Donations (Public, All Statuses)

- **Auth:** None

---

#### GET `/api/donations/my-donations` — Get My Donations

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant`

**Success Response (200):**
```json
{
  "success": true,
  "donations": [ { "...donation objects..." } ]
}
```

---

#### GET `/api/donations/:id` — Get Donation by ID

- **Auth:** None

**Success Response (200):**
```json
{
  "success": true,
  "donation": { "...donation object..." }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Donation not found"
}
```

---

#### PUT `/api/donations/:id` — Update a Donation

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant` (own donations only)

---

#### DELETE `/api/donations/:id` — Delete a Donation

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant` (own donations only)

---

#### GET `/api/donations` — Get All Donations (Authenticated)

- **Auth:** Required (Bearer Token)

---

### 2.4 Requests (`/api/requests`)

#### POST `/api/requests` — Create a Food Request

- **Auth:** Required (Bearer Token)
- **Role:** `shelter`

**Request Body:**
```json
{
  "donationId": "64def456...",
  "foodName": "Rice",
  "requestedQuantity": 5,
  "message": "Needed urgently for 50 people"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Request created successfully",
  "request": {
    "_id": "64ghi789...",
    "donationId": "64def456...",
    "foodName": "Rice",
    "requestedQuantity": 5,
    "status": "pending",
    "shelter": "64xyz..."
  }
}
```

---

#### PUT `/api/requests/:id/approve` — Approve a Request

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant`
- Sends email notification to the shelter

**Success Response (200):**
```json
{
  "success": true,
  "message": "Request approved successfully"
}
```

---

#### PUT `/api/requests/:id/reject` — Reject a Request

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant`
- Sends email notification to the shelter

**Success Response (200):**
```json
{
  "success": true,
  "message": "Request rejected successfully"
}
```

---

#### PUT `/api/requests/:id` — Update a Pending Request

- **Auth:** Required (Bearer Token)
- **Role:** `shelter` (own pending requests only)

**Request Body:**
```json
{
  "foodName": "Rice",
  "requestedQuantity": 3,
  "message": "Updated message"
}
```

---

#### DELETE `/api/requests/:id` — Delete a Pending Request

- **Auth:** Required (Bearer Token)
- **Role:** `shelter` (own pending requests only)

---

#### GET `/api/requests/my-requests` — Get My Requests (Shelter)

- **Auth:** Required (Bearer Token)
- **Role:** `shelter`

---

#### GET `/api/requests/my-approved-requests` — Get My Approved Requests with Delivery Status

- **Auth:** Required (Bearer Token)
- **Role:** `shelter`

**Success Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "requestId": "64ghi789...",
      "foodName": "Rice",
      "deliveryStatus": "scheduled",
      "deliveryIssue": null
    }
  ]
}
```

---

#### GET `/api/requests/my-donations` — Get Requests on My Donations (Donor)

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `restaurant`

---

#### GET `/api/requests` — Get All Requests

- **Auth:** Required (Bearer Token)

---

#### GET `/api/requests/donation/:donationId` — Get Requests for a Specific Donation

- **Auth:** Required (Bearer Token)

---

### 2.5 Pickups (`/api/pickups`)

#### GET `/api/pickups` — Get All Pickups

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### GET `/api/pickups/approved-requests` — Get Approved Requests Awaiting Pickup

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### GET `/api/pickups/:id` — Get Pickup by ID

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### PUT `/api/pickups/:id` — Update Pickup (Scheduled Time/Notes)

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### POST `/api/pickups/schedule` — Schedule a Pickup

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `manager`, `admin`

---

#### PUT `/api/pickups/:id/complete` — Mark Pickup as Completed

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `manager`, `admin`

---

#### PUT `/api/pickups/:id/cancel` — Cancel a Pickup

- **Auth:** Required (Bearer Token)
- **Role:** `donor`, `manager`, `admin`

---

### 2.6 Deliveries (`/api/delivery`)

#### GET `/api/delivery/getalldelivery` — Get All Deliveries

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### POST `/api/delivery/confirm` — Confirm a Delivery

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### PUT `/api/delivery/start/:deliveryId` — Start a Delivery

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### PUT `/api/delivery/complete/:deliveryId` — Complete a Delivery

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

#### DELETE `/api/delivery/cancel/:deliveryId` — Cancel a Delivery

- **Auth:** Required (Bearer Token)
- **Role:** `manager`, `admin`

---

### 2.7 Users (`/api/users`)

> All user routes require authentication. Admin-only routes are noted below.

#### PUT `/api/users/profile` — Update Own Profile

- **Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "0779876543",
  "organizationName": "Updated Org Name",
  "address": {
    "street": "456 Second Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90001",
    "country": "USA"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "...user object..." }
}
```

---

#### DELETE `/api/users/profile` — Delete Own Account

- **Auth:** Required (Bearer Token)

---

#### GET `/api/users` — Get All Users (Admin Only)

- **Auth:** Required (Bearer Token)
- **Role:** `admin`

---

#### GET `/api/users/role/:role` — Get Users by Role (Admin Only)

- **Auth:** Required (Bearer Token)
- **Role:** `admin`

---

#### GET `/api/users/:id` — Get User by ID (Admin Only)

- **Auth:** Required (Bearer Token)
- **Role:** `admin`

---

#### PUT `/api/users/:id` — Update User (Admin Only)

- **Auth:** Required (Bearer Token)
- **Role:** `admin`

---

#### DELETE `/api/users/:id` — Delete User (Admin Only)

- **Auth:** Required (Bearer Token)
- **Role:** `admin`

---

### 2.8 API Summary Table

| Module       | Method | Endpoint                            | Auth     | Role                      |
|-------------|--------|-------------------------------------|----------|---------------------------|
| Health      | GET    | `/api/health`                       | No       | Public                    |
| Auth        | POST   | `/api/auth/register`                | No       | Public                    |
| Auth        | POST   | `/api/auth/login`                   | No       | Public                    |
| Auth        | GET    | `/api/auth/profile`                 | Yes      | Any authenticated         |
| Auth        | PUT    | `/api/auth/updatepassword`          | Yes      | Any authenticated         |
| Donations   | POST   | `/api/donations`                    | Yes      | donor, restaurant         |
| Donations   | GET    | `/api/donations/available`          | No       | Public                    |
| Donations   | GET    | `/api/donations/public`             | No       | Public                    |
| Donations   | GET    | `/api/donations/my-donations`       | Yes      | donor, restaurant         |
| Donations   | GET    | `/api/donations/:id`                | No       | Public                    |
| Donations   | PUT    | `/api/donations/:id`                | Yes      | donor, restaurant (own)   |
| Donations   | DELETE | `/api/donations/:id`                | Yes      | donor, restaurant (own)   |
| Donations   | GET    | `/api/donations`                    | Yes      | Any authenticated         |
| Requests    | POST   | `/api/requests`                     | Yes      | shelter                   |
| Requests    | PUT    | `/api/requests/:id/approve`         | Yes      | donor, restaurant         |
| Requests    | PUT    | `/api/requests/:id/reject`          | Yes      | donor, restaurant         |
| Requests    | PUT    | `/api/requests/:id`                 | Yes      | shelter (own pending)     |
| Requests    | DELETE | `/api/requests/:id`                 | Yes      | shelter (own pending)     |
| Requests    | GET    | `/api/requests/my-requests`         | Yes      | shelter                   |
| Requests    | GET    | `/api/requests/my-approved-requests`| Yes      | shelter                   |
| Requests    | GET    | `/api/requests/my-donations`        | Yes      | donor, restaurant         |
| Requests    | GET    | `/api/requests`                     | Yes      | Any authenticated         |
| Requests    | GET    | `/api/requests/donation/:donationId`| Yes      | Any authenticated         |
| Pickups     | GET    | `/api/pickups`                      | Yes      | manager, admin            |
| Pickups     | GET    | `/api/pickups/approved-requests`    | Yes      | manager, admin            |
| Pickups     | GET    | `/api/pickups/:id`                  | Yes      | manager, admin            |
| Pickups     | PUT    | `/api/pickups/:id`                  | Yes      | manager, admin            |
| Pickups     | POST   | `/api/pickups/schedule`             | Yes      | donor, manager, admin     |
| Pickups     | PUT    | `/api/pickups/:id/complete`         | Yes      | donor, manager, admin     |
| Pickups     | PUT    | `/api/pickups/:id/cancel`           | Yes      | donor, manager, admin     |
| Deliveries  | GET    | `/api/delivery/getalldelivery`      | Yes      | manager, admin            |
| Deliveries  | POST   | `/api/delivery/confirm`             | Yes      | manager, admin            |
| Deliveries  | PUT    | `/api/delivery/start/:deliveryId`   | Yes      | manager, admin            |
| Deliveries  | PUT    | `/api/delivery/complete/:deliveryId`| Yes      | manager, admin            |
| Deliveries  | DELETE | `/api/delivery/cancel/:deliveryId`  | Yes      | manager, admin            |
| Users       | PUT    | `/api/users/profile`                | Yes      | Any authenticated         |
| Users       | DELETE | `/api/users/profile`                | Yes      | Any authenticated         |
| Users       | GET    | `/api/users`                        | Yes      | admin                     |
| Users       | GET    | `/api/users/role/:role`             | Yes      | admin                     |
| Users       | GET    | `/api/users/:id`                    | Yes      | admin                     |
| Users       | PUT    | `/api/users/:id`                    | Yes      | admin                     |
| Users       | DELETE | `/api/users/:id`                    | Yes      | admin                     |

---

## 3. Deployment Report

### 3.1 Frontend Deployment — Vercel

**Platform:** [Vercel](https://vercel.com)  
**Live URL:** [https://shareplate-theta.vercel.app](https://shareplate-theta.vercel.app/)

#### Setup Steps

1. Log in to [Vercel](https://vercel.com) and click **"Add New → Project"**
2. Import the GitHub repository: `lahirudeshan01/SharePlate`
3. Set the **Root Directory** to `frontend`
4. Set the **Framework Preset** to `Vite`
5. Configure environment variables (see below)
6. Click **Deploy**

#### Environment Variables (Vercel)

| Variable       | Description                          |
|---------------|--------------------------------------|
| `VITE_API_URL` | Backend API base URL (e.g., `https://shareplate-urz2.onrender.com/api`) |

#### Deployment Evidence

**Step 1 — Import Git Repository on Vercel:**

![Vercel Import Repository](docs/screenshots/Hosting/6.png)

**Step 2 — Deployment Success Confirmation:**

![Vercel Deployment Success](docs/screenshots/Hosting/7.png)

**Step 3 — Production Deployment Dashboard (Status: Ready):**

![Vercel Production Dashboard](docs/screenshots/Hosting/8.png)

---

### 3.2 Backend Deployment — Render

**Platform:** [Render](https://render.com)  
**Live URL:** [https://shareplate-urz2.onrender.com](https://shareplate-urz2.onrender.com)

#### Setup Steps

1. Log in to [Render](https://render.com) and create a **New Web Service**
2. Connect the GitHub repository: `lahirudeshan01/SharePlate`
3. Set the **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Set **Environment** to `Node`
7. Configure environment variables (see below)
8. Click **Deploy**

#### Environment Variables (Render)

| Variable       | Description                                  |
|---------------|----------------------------------------------|
| `MONGO_URI`    | MongoDB Atlas connection string              |
| `JWT_SECRET`   | Secret key for JWT token signing             |
| `FRONTEND_URL` | Frontend URL for CORS and email links        |

> **Note:** Actual secret values are not exposed in this document for security reasons.

#### Deployment Evidence

**Step 1 — Create New Web Service and connect Git repository:**

![Render New Web Service](docs/screenshots/Hosting/1.png)

**Step 2 — Configure service (Name, Language, Branch, Region):**

![Render Service Configuration](docs/screenshots/Hosting/2.png)

**Step 3 — Set build/start commands and select Free instance:**

![Render Build Commands and Instance Type](docs/screenshots/Hosting/3.png)

**Step 4 — Backend service building from GitHub:**

![Render Dashboard - Building](docs/screenshots/Hosting/4.png)

**Step 5 — Backend deployed and live on port 10000:**

![Render Dashboard - Live](docs/screenshots/Hosting/5.png)

> **Note:** The Render free tier spins down with inactivity, which can delay initial requests by 50 seconds or more.

---

### 3.3 Deployment Architecture

```
┌─────────────────┐        HTTPS        ┌──────────────────┐
│                 │  ──────────────────> │                  │
│   Frontend      │                      │   Backend API    │
│   (Vercel)      │  <────────────────── │   (Render)       │
│                 │        JSON          │                  │
│  React + Vite   │                      │  Express + Node  │
└─────────────────┘                      └────────┬─────────┘
                                                  │
                                                  │ MongoDB Driver
                                                  ▼
                                         ┌──────────────────┐
                                         │  MongoDB Atlas    │
                                         │  (Cloud DB)       │
                                         └──────────────────┘
```

---

## 4. Testing Instruction Report

### 4.1 Testing Overview

The SharePlate backend uses **Jest** as the testing framework. Tests are organized into three categories:

| Type         | Location                        | Description                              |
|-------------|--------------------------------|------------------------------------------|
| Unit Tests   | `backend/tests/unit/`          | Test individual functions and middleware  |
| Integration  | `backend/tests/integration/`   | Test API endpoints with HTTP requests    |
| Performance  | `backend/performance/`         | Load testing with Artillery              |

### 4.2 Testing Environment Configuration

**Jest Configuration** (`backend/jest.config.js`):

```js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!node_modules/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000
};
```

**Required Environment for Testing:**

Create a `.env` (or `.env.test`) file in the `backend/` directory:

```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/shareplate-test
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3001
```

### 4.3 How to Run Unit Tests

Unit tests test individual components (controllers, middleware, services) in isolation using mocks.

**Test files:**
- `backend/tests/unit/authMiddleware.test.js` — Authentication middleware tests
- `backend/tests/unit/emailService.test.js` — Email service tests
- `backend/tests/unit/requestController.test.js` — Request controller tests

**Run unit tests:**

```bash
cd backend
npm run test:unit
```

**Expected output:**

```
PASS  tests/unit/authMiddleware.test.js
PASS  tests/unit/emailService.test.js
PASS  tests/unit/requestController.test.js

Test Suites: 3 passed, 3 total
Tests:       X passed, X total
```

### 4.4 Integration Testing Setup and Execution

Integration tests test the full API request/response cycle by making HTTP requests to the running server and verifying responses against a test database.

**Test files:**
- `backend/tests/integration/auth.api.test.js` — Authentication API tests
- `backend/tests/integration/donation.api.test.js` — Donation API tests
- `backend/tests/integration/pickup.api.test.js` — Pickup API tests
- `backend/tests/integration/request.api.test.js` — Request API tests
- `backend/tests/integration/user.api.test.js` — User API tests

**Prerequisites:**
1. Ensure MongoDB is running locally (or configure `MONGO_URI` to a test database)
2. The test helper (`backend/tests/integrationHelper.js`) handles server setup/teardown

**Run integration tests:**

```bash
cd backend
npm run test:integration
```

> The `--runInBand` flag is included in the script to run tests sequentially, preventing database conflicts between test suites.

**Run all tests (unit + integration) with coverage:**

```bash
cd backend
npm run test:coverage
```

This generates a coverage report in `backend/coverage/`. Open `backend/coverage/lcov-report/index.html` in a browser to view the detailed HTML coverage report.

### 4.5 Performance Testing Setup and Execution

Performance tests use **[Artillery](https://www.artillery.io/)** to simulate load on the API.

**Configuration file:** `backend/performance/artillery.yml`

**Test environments available:**

| Environment | Duration | Arrival Rate     | Description              |
|------------|----------|------------------|--------------------------|
| Light      | 60s      | 5 → 10 req/s    | Basic smoke test         |
| Medium     | 150s     | 10 → 20 req/s   | Moderate sustained load  |
| Heavy      | 210s     | 20 → 80 req/s   | High concurrency stress  |

**Test scenarios:**
1. **Health endpoint throughput** (weight: 45%) — Tests `/api/health`
2. **Register and fetch profile** (weight: 35%) — Tests user registration + profile retrieval
3. **Browse available donations** (weight: 20%) — Tests public donation listing

**Prerequisites:**
1. Install Artillery globally:
   ```bash
   npm install -g artillery
   ```
2. Start the backend server locally:
   ```bash
   cd backend
   npm run dev
   ```

**Run performance tests:**

```bash
cd backend

# Light load test
npm run perf:light

# Medium load test
npm run perf:medium

# Heavy load test
npm run perf:heavy

# Generate JSON report
npm run perf:report

# Convert JSON report to HTML
npm run perf:report:html
```

**Performance reports** are saved to `backend/performance/reports/`.

### 4.6 Complete NPM Test Scripts Summary

| Command                    | Description                                        |
|---------------------------|----------------------------------------------------|
| `npm test`                | Run all tests                                       |
| `npm run test:unit`       | Run unit tests only                                 |
| `npm run test:integration`| Run integration tests (sequential, with force exit) |
| `npm run test:coverage`   | Run all tests with code coverage report             |
| `npm run perf:light`      | Light performance test (60s, 5-10 req/s)            |
| `npm run perf:medium`     | Medium performance test (150s, 10-20 req/s)         |
| `npm run perf:heavy`      | Heavy performance test (210s, 20-80 req/s)          |
| `npm run perf:report`     | Generate performance JSON report                    |
| `npm run perf:report:html`| Convert JSON report to HTML                         |

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|------------------------------------------------|
| Frontend  | React 19, Vite, Material UI 5, Tailwind CSS    |
| Backend   | Node.js, Express 5, Mongoose 9                  |
| Database  | MongoDB (Atlas for production)                  |
| Auth      | JWT (JSON Web Tokens), bcryptjs                 |
| Email     | Nodemailer (Gmail SMTP)                         |
| Testing   | Jest, Supertest, Artillery                       |
| Hosting   | Vercel (frontend), Render (backend)             |

---

## License

This project is developed as part of the Application Frameworks module coursework at SLIIT.
# SharePlate — Food Donation Management Platform

> **Connecting restaurants with shelters to reduce food waste and feed communities — one plate at a time.**

SharePlate is a full-stack web application that enables food donors (restaurants, individuals) to share surplus food with shelters and communities in need. The platform supports donation management, request handling, pickup scheduling, delivery tracking, and email notifications.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoint Documentation](#api-endpoint-documentation)
  - [Authentication](#1-authentication-apiauth)
  - [Users](#2-users-apiusers)
  - [Donations](#3-donations-apidonations)
  - [Requests](#4-requests-apirequests)
  - [Pickups](#5-pickups-apipickups)
  - [Deliveries](#6-deliveries-apidelivery)
  - [Health Check](#7-health-check)
- [Deployment Report](#deployment-report)
- [Testing Instruction Report](#testing-instruction-report)

---

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19, Vite 7, Material UI 5, Tailwind CSS 3, React Router 6 |
| Backend    | Node.js, Express 5, Mongoose 9 (MongoDB ODM)                |
| Database   | MongoDB (Atlas for production)                                |
| Auth       | JSON Web Tokens (JWT), bcryptjs                               |
| Email      | Nodemailer                                                    |
| Testing    | Jest, Supertest, Artillery (performance)                      |
| Deployment | Vercel (frontend), Render (backend)                           |

---

## Project Structure

```
SharePlate/
├── backend/
│   ├── server.js                  # Entry point — loads env, connects DB, starts server
│   ├── jest.config.js             # Jest test configuration
│   ├── package.json
│   ├── performance/               # Artillery performance tests
│   │   ├── artillery.yml
│   │   ├── processor.js
│   │   └── reports/
│   ├── src/
│   │   ├── app.js                 # Express app setup (CORS, routes, middleware)
│   │   ├── config/                # DB, email, Swagger, app config
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # Auth, role, validation, error handling
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/                # Express route definitions
│   │   ├── utils/                 # Response handler, token utilities
│   │   └── validators/            # Input validation schemas
│   └── tests/
│       ├── unit/                  # Unit tests
│       └── integration/           # Integration tests
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/            # Shared components (Navbar, Layout, Auth)
│       ├── context/               # React context (AuthContext)
│       ├── pages/                 # Page components
│       ├── services/              # API service layer
│       └── styles/                # Global styles
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18+ (recommended v22)
- **npm** v9+
- **MongoDB** — local instance running on `mongodb://localhost:27017` or a MongoDB Atlas connection string
- **Git**

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/lahirudeshan01/SharePlate.git
cd SharePlate/backend

# 2. Install dependencies
npm install

# 3. Create environment file
#    Copy the template below and fill in your values
cp .env.example .env   # or create .env manually
```

**Backend `.env` file:**

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/shareplate
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Email (optional — for notification features)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Rate Limiting (optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

```bash
# 4. Start MongoDB (if running locally)
mongod

# 5. Start the backend server
npm run dev          # Development mode with hot-reload (nodemon)
# or
npm start            # Production mode
```

The backend will be running at **http://localhost:5000**.
Swagger API docs are available at **http://localhost:5000/api-docs**.

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd SharePlate/frontend

# 2. Install dependencies
npm install

# 3. Create environment file
```

**Frontend `.env` file:**

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# 4. Start the development server
npm run dev
```

The frontend will be running at **http://localhost:5173**.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## API Endpoint Documentation

**Base URL:** `https://shareplate-urz2.onrender.com/api` (production) or `http://localhost:5000/api` (local)

**Authentication:** Most endpoints require a JWT token sent via the `Authorization` header:

```
Authorization: Bearer <token>
```

### 1. Authentication (`/api/auth`)

#### POST `/api/auth/register`

Register a new user account.

- **Auth:** None
- **Roles Created:** `donor`, `shelter`, `manager`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "donor",
  "organizationName": "Food Bank NGO",
  "phone": "0771234567",
  "address": {
    "street": "123 Main St",
    "city": "Colombo",
    "state": "Western",
    "zipCode": "10000",
    "country": "Sri Lanka"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

#### POST `/api/auth/login`

Authenticate and receive a JWT token.

- **Auth:** None

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

#### GET `/api/auth/profile`

Get the authenticated user's profile.

- **Auth:** Bearer Token (any role)

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "organizationName": "Food Bank NGO",
    "phone": "0771234567"
  }
}
```

---

#### PUT `/api/auth/updatepassword`

Update the authenticated user's password.

- **Auth:** Bearer Token (any role)

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### 2. Users (`/api/users`)

> All user routes require authentication. Admin-only routes are noted.

#### PUT `/api/users/profile`

Update the authenticated user's own profile.

- **Auth:** Bearer Token (any role)

**Request Body:**

```json
{
  "name": "Jane Doe",
  "phone": "0779876543",
  "organizationName": "Updated Org Name",
  "address": {
    "street": "456 Second Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90001",
    "country": "USA"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "..." : "..." }
}
```

---

#### DELETE `/api/users/profile`

Delete the authenticated user's own account.

- **Auth:** Bearer Token (any role)

---

#### GET `/api/users/` — Admin Only

Get all users.

- **Auth:** Bearer Token (`admin`)

---

#### GET `/api/users/role/:role` — Admin Only

Get all users filtered by role.

- **Auth:** Bearer Token (`admin`)
- **Params:** `role` — one of `donor`, `shelter`, `manager`, `admin`

---

#### GET `/api/users/:id` — Admin Only

Get a single user by ID.

- **Auth:** Bearer Token (`admin`)

---

#### PUT `/api/users/:id` — Admin Only

Update a user by ID.

- **Auth:** Bearer Token (`admin`)

---

#### DELETE `/api/users/:id` — Admin Only

Delete a user by ID.

- **Auth:** Bearer Token (`admin`)

---

### 3. Donations (`/api/donations`)

#### POST `/api/donations`

Create a new food donation.

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant`

**Request Body:**

```json
{
  "foodName": "Rice",
  "quantity": 10,
  "expiryDate": "2026-06-01",
  "description": "Freshly cooked basmati rice",
  "pickupAddress": "123 Main St, Colombo",
  "location": {
    "address": "123 Main St",
    "lat": 6.9271,
    "lng": 79.8612
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Donation created successfully",
  "donation": {
    "_id": "64abc456...",
    "foodName": "Rice",
    "quantity": 10,
    "donor": "64abc123...",
    "expiryDate": "2026-06-01T00:00:00.000Z",
    "status": "available",
    "createdAt": "2026-04-12T..."
  }
}
```

---

#### GET `/api/donations/available`

Get all available (non-expired) donations.

- **Auth:** None (public)

**Response (200):**

```json
{
  "success": true,
  "count": 5,
  "donations": [ "..." ]
}
```

---

#### GET `/api/donations/public`

Get all donations (all statuses).

- **Auth:** None (public)

---

#### GET `/api/donations/my-donations`

Get all donations created by the authenticated donor.

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant`

---

#### GET `/api/donations/:id`

Get a single donation by ID.

- **Auth:** None (public)

---

#### GET `/api/donations`

Get all donations (authenticated).

- **Auth:** Bearer Token (any role)

---

#### PUT `/api/donations/:id`

Update an existing donation.

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant` (own donations only)

---

#### DELETE `/api/donations/:id`

Delete a donation.

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant` (own donations only)

---

### 4. Requests (`/api/requests`)

#### POST `/api/requests`

Create a new food request for a donation.

- **Auth:** Bearer Token
- **Roles:** `shelter`

**Request Body:**

```json
{
  "donationId": "64abc456...",
  "foodName": "Rice",
  "requestedQuantity": 5,
  "message": "Needed urgently for 50 people"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Request created successfully",
  "request": {
    "_id": "64def789...",
    "donationId": "64abc456...",
    "shelter": "64abc321...",
    "foodName": "Rice",
    "requestedQuantity": 5,
    "status": "pending",
    "createdAt": "2026-04-12T..."
  }
}
```

---

#### PUT `/api/requests/:id/approve`

Approve a food request (sends email notification to shelter).

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant`

**Response (200):**

```json
{
  "success": true,
  "message": "Request approved successfully"
}
```

---

#### PUT `/api/requests/:id/reject`

Reject a food request (sends email notification to shelter).

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant`

---

#### PUT `/api/requests/:id`

Update a pending request.

- **Auth:** Bearer Token
- **Roles:** `shelter` (own requests only)

**Request Body:**

```json
{
  "foodName": "Rice",
  "requestedQuantity": 3,
  "message": "Updated message"
}
```

---

#### DELETE `/api/requests/:id`

Delete a pending request.

- **Auth:** Bearer Token
- **Roles:** `shelter` (own requests only)

---

#### GET `/api/requests/my-requests`

Get all requests made by the authenticated shelter.

- **Auth:** Bearer Token
- **Roles:** `shelter`

---

#### GET `/api/requests/my-approved-requests`

Get approved requests with delivery status for the shelter.

- **Auth:** Bearer Token
- **Roles:** `shelter`

**Response includes:** `requestId`, `foodName`, `deliveryStatus`, `deliveryIssue`

---

#### GET `/api/requests/my-donations`

Get all requests on the authenticated donor's donations.

- **Auth:** Bearer Token
- **Roles:** `donor`, `restaurant`

---

#### GET `/api/requests`

Get all requests.

- **Auth:** Bearer Token (any role)

---

#### GET `/api/requests/donation/:donationId`

Get all requests for a specific donation.

- **Auth:** Bearer Token (any role)

---

### 5. Pickups (`/api/pickups`)

#### GET `/api/pickups`

Get all pickups.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### GET `/api/pickups/approved-requests`

Get approved requests awaiting pickup scheduling.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### GET `/api/pickups/:id`

Get a single pickup by ID.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### POST `/api/pickups/schedule`

Schedule a new pickup.

- **Auth:** Bearer Token
- **Roles:** `donor`, `manager`, `admin`

---

#### PUT `/api/pickups/:id`

Update pickup details (scheduled time, notes).

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### PUT `/api/pickups/:id/complete`

Mark a pickup as completed.

- **Auth:** Bearer Token
- **Roles:** `donor`, `manager`, `admin`

---

#### PUT `/api/pickups/:id/cancel`

Cancel a pickup.

- **Auth:** Bearer Token
- **Roles:** `donor`, `manager`, `admin`

---

### 6. Deliveries (`/api/delivery`)

#### GET `/api/delivery/getalldelivery`

Get all deliveries.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### POST `/api/delivery/confirm`

Confirm a delivery.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### PUT `/api/delivery/start/:deliveryId`

Start a delivery.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### PUT `/api/delivery/complete/:deliveryId`

Complete a delivery.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

#### DELETE `/api/delivery/cancel/:deliveryId`

Cancel a delivery.

- **Auth:** Bearer Token
- **Roles:** `manager`, `admin`

---

### 7. Health Check

#### GET `/api/health`

Check if the API is running.

- **Auth:** None

**Response (200):**

```json
{
  "status": "ok"
}
```

---

## Deployment Report

### Backend Deployment — Render

**Platform:** [Render](https://render.com) — Web Service (Free tier)

**Live URL:** https://shareplate-urz2.onrender.com

**Setup Steps:**

1. Created a new **Web Service** on Render.
2. Connected the GitHub repository: `lahirudeshan01/SharePlate`.
3. Configured the service:
   - **Name:** SharePlate
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` → runs `node server.js`
   - **Runtime:** Node.js 22
4. Added the required environment variables (see below).
5. Deployed — Render automatically builds and deploys on pushes to `main`.

> **Note:** The free tier spins down after inactivity, which can delay initial requests by 50 seconds or more.

**Environment Variables (Render):**

| Variable       | Description                           |
| -------------- | ------------------------------------- |
| `MONGO_URI`    | MongoDB Atlas connection string       |
| `JWT_SECRET`   | Secret key for signing JWT tokens     |
| `FRONTEND_URL` | Frontend URL for CORS and email links |

---

### Frontend Deployment — Vercel

**Platform:** [Vercel](https://vercel.com)

**Live URL:** https://shareplate-theta.vercel.app

**Setup Steps:**

1. Imported the GitHub repository into Vercel: `lahirudeshan01/SharePlate`.
2. Configured the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Added the required environment variable (see below).
4. Deployed — Vercel automatically deploys on pushes to `main`.

**Environment Variables (Vercel):**

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| `VITE_API_URL` | Backend API base URL (Render live URL)  |

---

### Deployment Evidence

#### Vercel Frontend — Production Deployment (Ready)

![Vercel Deployment - Production Ready](docs/screenshots/vercel-deployment.png)

> The screenshot shows the Vercel dashboard with the SharePlate frontend deployed successfully. Status: **Ready**. Domain: `shareplate-theta.vercel.app`. Source branch: `main`, commit `3c3c1a3` — "fix deployment requirements".

#### Vercel Frontend — Successful Deployment Confirmation

![Vercel Deployment - Congratulations](docs/screenshots/vercel-congratulations.png)

> Confirmation page showing successful deployment to `lahirudeshan01`'s projects with the live application preview displaying the SharePlate landing page.

#### Render Backend — Build & Deploy (Live)

![Render Deployment - Building](docs/screenshots/render-building.png)

> The Render dashboard showing the SharePlate backend Web Service (Node, Free tier). The latest deploy from commit `3c3c1a3` is building. The service URL is `https://shareplate-urz2.onrender.com`.

#### Render Backend — Server Running Successfully

![Render Deployment - Live](docs/screenshots/render-live.png)

> The Render deployment logs showing the server is **Live**. The logs confirm: `Server running on port 10000`. A MongoDB connection error to `localhost:27017` is expected on initial boot before the Atlas connection is established via the `MONGO_URI` environment variable.

---

## Testing Instruction Report

### Testing Overview

SharePlate uses **Jest** as the test runner with **Supertest** for HTTP integration tests and **Artillery** for performance/load testing.

### i. How to Run Unit Tests

Unit tests cover individual modules (middleware, controllers, services) in isolation using mocks.

```bash
cd backend

# Run all unit tests
npm run test:unit

# Run a specific unit test file
npx jest --testPathPattern="tests/unit/authMiddleware" --no-coverage

# Run with verbose output
npx jest --testPathPattern=unit --verbose --no-coverage
```

**Unit test files:**

| Test File                              | Coverage                           |
| -------------------------------------- | ---------------------------------- |
| `tests/unit/authMiddleware.test.js`    | Auth middleware JWT verification   |
| `tests/unit/emailService.test.js`      | Email notification service         |
| `tests/unit/requestController.test.js` | Request controller logic           |

### ii. Integration Testing Setup and Execution

Integration tests use a **real MongoDB instance** and make actual HTTP requests via Supertest. They validate full request-response cycles through the Express app.

**Prerequisites:**

- MongoDB must be running locally on `mongodb://localhost:27017`, or set the `MONGO_URI` environment variable pointing to a test database.

**Setup:**

```bash
cd backend

# Ensure MongoDB is running locally
mongod

# Set test environment variables
# On Windows (PowerShell):
$env:NODE_ENV="test"
$env:JWT_SECRET="test-secret"

# On Linux/Mac:
export NODE_ENV=test
export JWT_SECRET=test-secret
```

**Execution:**

```bash
# Run all integration tests
npm run test:integration

# Run a specific integration test suite
npx jest --testPathPattern="tests/integration/auth" --forceExit --runInBand --no-coverage
npx jest --testPathPattern="tests/integration/donation" --forceExit --runInBand --no-coverage
npx jest --testPathPattern="tests/integration/request" --forceExit --runInBand --no-coverage
npx jest --testPathPattern="tests/integration/pickup" --forceExit --runInBand --no-coverage
npx jest --testPathPattern="tests/integration/user" --forceExit --runInBand --no-coverage
```

**Integration test files:**

| Test File                              | Coverage                                      |
| -------------------------------------- | --------------------------------------------- |
| `tests/integration/auth.api.test.js`     | Register, login, profile, password update     |
| `tests/integration/donation.api.test.js` | CRUD donations, availability, authorization   |
| `tests/integration/request.api.test.js`  | Create/approve/reject requests, notifications |
| `tests/integration/pickup.api.test.js`   | Schedule, complete, cancel pickups            |
| `tests/integration/user.api.test.js`     | Profile updates, admin user management        |

**How it works:**

- The `integrationHelper.js` module connects to a test MongoDB database (`shareplate-test`) before tests run.
- After all tests complete, the test database is dropped and the connection is closed.
- If MongoDB is unavailable, integration tests are automatically **skipped** (not failed).
- The `--runInBand` flag runs tests serially to avoid database conflicts.
- The `--forceExit` flag ensures Jest exits after tests complete.

### iii. Performance Testing Setup and Execution

Performance tests use **Artillery** to simulate load against the API.

**Prerequisites:**

```bash
# Install Artillery globally (if not already installed)
npm install -g artillery

# Or use npx (no install needed)
npx artillery --version
```

**Setup:**

1. Start the backend server locally:

   ```bash
   cd backend
   npm run dev
   ```

2. (Optional) Disable rate limiting for accurate results:

   ```env
   RATE_LIMIT_ENABLED=false
   ```

**Execution:**

```bash
cd backend

# Light load — 60s, 5→10 requests/sec
npm run perf:light

# Medium load — 30s warmup + 120s sustained, 10→20 requests/sec
npm run perf:medium

# Heavy load — 30s warmup + 180s sustained, 20→80 requests/sec
npm run perf:heavy

# Generate a JSON report
npm run perf:report

# Convert JSON report to HTML
npm run perf:report:html
```

**Performance test scenarios (defined in `performance/artillery.yml`):**

| Scenario                    | Weight | Description                            |
| --------------------------- | ------ | -------------------------------------- |
| Health endpoint throughput  | 45%    | GET `/api/health` — baseline throughput |
| Register and fetch profile  | 35%    | POST register → GET profile with token |
| Register and login cycle    | 20%    | POST register → POST login             |

**Reports** are saved to `backend/performance/reports/`.

### iv. Testing Environment Configuration Details

**Jest Configuration (`jest.config.js`):**

```js
{
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',     // Exclude config files
    '!node_modules/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000       // 10 second timeout per test
}
```

**Environment Variables for Testing:**

| Variable     | Value                                      | Purpose                    |
| ------------ | ------------------------------------------ | -------------------------- |
| `NODE_ENV`   | `test`                                     | Prevents server auto-start |
| `JWT_SECRET` | `test-secret-key-for-testing`              | JWT signing in test env    |
| `MONGO_URI`  | `mongodb://localhost:27017/shareplate-test` | Test database (auto-dropped) |

**Running the full test suite with coverage:**

```bash
cd backend

# All tests with coverage report
npm run test:coverage

# Coverage report is generated in backend/coverage/
# Open backend/coverage/lcov-report/index.html for the HTML report
```

**Available npm test scripts:**

| Script                       | Command                                              |
| ---------------------------- | ---------------------------------------------------- |
| `npm test`                   | Run all tests                                        |
| `npm run test:unit`          | Run unit tests only                                  |
| `npm run test:integration`   | Run integration tests (serial, with force-exit)      |
| `npm run test:coverage`      | Run all tests with coverage report                   |
| `npm run perf:light`         | Artillery light load test                            |
| `npm run perf:medium`        | Artillery medium load test                           |
| `npm run perf:heavy`         | Artillery heavy load test                            |

---

## Live URLs

| Service  | URL                                          |
| -------- | -------------------------------------------- |
| Frontend | https://shareplate-theta.vercel.app          |
| Backend  | https://shareplate-urz2.onrender.com         |
| API Docs | https://shareplate-urz2.onrender.com/api-docs |

---

## License

This project is developed as part of the Application Frameworks module coursework at SLIIT.
  - [ ] View all submitted requests
  - [ ] See request status (pending/approved/rejected)
  - [ ] See request details
  - [ ] Delete pending request
  - [ ] Status updates in real-time

- [ ] **Dashboard (Donor)**
  - [ ] View incoming requests
  - [ ] See donation details
  - [ ] See shelter details
  - [ ] Approve request
  - [ ] Reject request
  - [ ] See status updates

#### Backend Testing

- [ ] **API Endpoints Accessible**
  - [ ] All 15+ endpoints responding
  - [ ] Correct HTTP methods
  - [ ] Proper status codes

- [ ] **Error Handling**
  - [ ] Invalid input returns 400
  - [ ] Unauthorized returns 401
  - [ ] Forbidden returns 403
  - [ ] Not found returns 404
  - [ ] Server errors return 500

- [ ] **Database Operations**
  - [ ] Data persists across requests
  - [ ] Relationships maintained
  - [ ] Timestamps updated

---

## 📸 Deployment Evidence

### Backend Deployment Screenshots
- ✅ Render Dashboard showing deployed API
- ✅ Environment variables configured
- ✅ Build logs showing successful deployment
- ✅ HTTP request to deployed API returning 200

### Frontend Deployment Screenshots
- ✅ Vercel Dashboard showing deployed frontend
- ✅ Build logs showing successful build
- ✅ Live URL accessible
- ✅ Screenshots of working features

### Testing Screenshots
- ✅ Unit test coverage report
- ✅ Integration test results
- ✅ Artillery performance test results
- ✅ Manual testing checklist completion

---

## 🔗 Live URLs

> ⚠️ **Update these URLs after deployment is complete.**

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | _To be updated after deployment_ | 🔴 Pending |
| **Backend API** | _To be updated after deployment_ | 🔴 Pending |
| **API Docs** | _To be updated after deployment_ | 🔴 Pending |
| **MongoDB** | MongoDB Atlas (Private) | 🟢 Connected |

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/SharePlate

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# CORS — set to your deployed frontend URL
ALLOWED_ORIGINS=https://your-app.vercel.app

# Rate Limiting (set RATE_LIMIT_ENABLED=false when running performance tests)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Email (Nodemailer / Gmail app password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (for password-reset links)
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env)
```env
# API base URL — must point to deployed backend
VITE_API_URL=https://your-api.onrender.com/api
```

**⚠️ Note**: Never commit `.env` files. Use `.env.example` as template.

---

## 📋 Checklist for Evaluation 2

### Group Contribution (30%)
- [ ] Component Design & Business Logic - Request Matching system
- [ ] Component Architecture - React functional components with hooks
- [ ] Documentation - Deployment README + setup guides
- [ ] README with project overview and deployment section

### Individual Contribution (70%)

#### Frontend Development (40%)
- [ ] React functional components implemented
- [ ] Context API for state management
- [ ] All CRUD operations integrated
- [ ] Authentication & protected routes
- [ ] Error handling & loading states
- [ ] UI responsive with Tailwind CSS

#### Deployment (20%)
- [ ] Backend deployed on Render/Railway
- [ ] Frontend deployed on Vercel/Netlify
- [ ] Live URLs documented
- [ ] Environment variables configured
- [ ] Deployment screenshots in README

#### Testing (10%)
- [ ] Unit tests for backend components
- [ ] Integration tests for API endpoints
- [ ] Performance tests with Artillery.io
- [ ] Manual testing completed
- [ ] Test results documented

#### Git Workflow (5%)
- [ ] Meaningful commit messages
- [ ] Regular commits throughout development
- [ ] Proper branch management
- [ ] Pull requests reviewed

#### Overall Quality (5%)
- [ ] Code follows best practices
- [ ] Error handling comprehensive
- [ ] Code is well-documented
- [ ] No console errors or warnings

---

## 📞 Support & Troubleshooting

### Common Deployment Issues

**Issue**: API URL errors on frontend
- **Solution**: Update `VITE_API_URL` in Vercel/Netlify environment variables

**Issue**: CORS errors
- **Solution**: Ensure backend allows frontend domain in CORS configuration

**Issue**: Database connection fails
- **Solution**: Check MongoDB Atlas IP whitelist includes server IP

**Issue**: Performance is slow
- **Solution**: Check Artillery results, optimize database queries

---

**Last Updated**: March 31, 2026  
**Version**: 1.1.0  
**Status**: Ready for Evaluation 2

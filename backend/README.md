# SharePlate Backend - User Management Module

## Overview
SharePlate is a MERN stack web application platform designed to minimize food waste by connecting restaurants to food banks and shelters. This backend handles the **Authentication & User Management** module.

## Features
- ✅ User Registration & Login (JWT-based authentication)
- ✅ Role-based Access Control (Restaurant, Shelter, Admin)
- ✅ Protected Routes & Middleware
- ✅ Input Validation & Error Handling
- ✅ MongoDB Integration
- ✅ RESTful API Design
- ✅ Security Best Practices (Helmet, Rate Limiting, Sanitization)

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express-validator
- **Security:** Helmet, express-mongo-sanitize, express-rate-limit

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── config.js           # Environment configuration
│   │   └── database.js         # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   └── userController.js   # User management logic
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   ├── roleMiddleware.js   # Role-based access
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validationMiddleware.js
│   ├── models/
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   └── userRoutes.js       # User endpoints
│   ├── validators/
│   │   └── userValidator.js    # Input validation rules
│   ├── utils/
│   │   ├── tokenUtils.js       # JWT utilities
│   │   └── responseHandler.js  # Response formatting
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
├── tests/
│   ├── auth.test.js
│   └── user.test.js
├── .env.example
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Steps
1. Clone the repository
```bash
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Update `.env` with your configuration
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/shareplate
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

5. Start MongoDB (if running locally)
```bash
mongod
```

6. Run the server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "restaurant",
  "phone": "1234567890",
  "organizationName": "John's Restaurant",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Update Password
```http
PUT /api/auth/updatepassword
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### User Management Routes (`/api/users`)

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer {admin-token}
```

#### Get User by ID (Admin Only)
```http
GET /api/users/:id
Authorization: Bearer {admin-token}
```

#### Update Own Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9876543210",
  "organizationName": "Updated Restaurant"
}
```

#### Update User by ID (Admin Only)
```http
PUT /api/users/:id
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "isActive": false,
  "isVerified": true
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
Authorization: Bearer {admin-token}
```

#### Get Users by Role (Admin Only)
```http
GET /api/users/role/:role
Authorization: Bearer {admin-token}
```

## User Roles
- **restaurant:** Can create donation listings
- **shelter:** Can request food donations
- **admin:** Full access to user management

## Validation Rules

### Registration
- Name: 2-50 characters
- Email: Valid email format
- Password: Min 6 chars, must contain uppercase, lowercase, and number
- Role: Must be 'restaurant', 'shelter', or 'admin'
- Phone: 10 digits (optional)
- Organization Name: Required for restaurant and shelter roles

### Login
- Email: Required, valid format
- Password: Required

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- HTTP security headers (Helmet)
- Rate limiting (100 requests per 15 minutes)
- MongoDB injection prevention
- Input validation and sanitization
- Role-based access control

## Error Handling
All errors are handled consistently with proper HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Performance Testing

API performance testing is implemented with Artillery to evaluate latency and error rates under concurrent traffic.

### Profiles
- `npm run perf:light` - low concurrency baseline
- `npm run perf:medium` - sustained medium traffic
- `npm run perf:heavy` - higher concurrency stress profile

### Report generation
```bash
# Run medium profile and save JSON metrics
npm run perf:report

# Convert JSON metrics to HTML report
npm run perf:report:html
```

### Performance test files
- `performance/artillery.yml` - load phases and endpoint scenarios
- `performance/processor.js` - dynamic user data generation
- `performance/README.md` - detailed usage notes

### Important notes
- Start the backend and MongoDB before running performance tests.
- Default rate limiting can cap throughput. For stress tests, raise limits with `RATE_LIMIT_MAX` or temporarily disable using `RATE_LIMIT_ENABLED=false`.
- Run against a non-production database to avoid polluting real user data.

## API Documentation
API documentation will be available via:
- Swagger UI (coming soon)
- Postman Collection (coming soon)

## Development Notes

### Assignment Requirements Checklist
- ✅ RESTful API with Express.js
- ✅ CRUD operations for users
- ✅ MongoDB integration
- ✅ Protected routes & role-based access
- ✅ Validation and error handling
- ✅ Clean architecture
- ⏳ Third-party API integration (planned: Email/SMS notifications)
- ⏳ API documentation with Swagger

### Future Enhancements
- Email verification on registration
- Password reset functionality
- Two-factor authentication
- Email/SMS notifications via third-party API
- Swagger documentation
- User activity logging
- Profile image upload

## Contributing
This is an academic project for the SharePlate team. Module developed by **Lahiru** - Authentication & User Management.

## License
ISC

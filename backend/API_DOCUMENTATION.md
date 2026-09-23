# SharePlate Backend API Documentation

Base URL: `http://localhost:5000`

## Donations API

Endpoint prefix: `/donations`

---

### 1) Get All Donations

- **Method:** `GET`
- **URL:** `http://localhost:5000/donations`
- **Headers:** `Content-Type: application/json`

#### Success Response (200)

```json
{
  "donations": [
    {
      "_id": "69a1ad70d11db241d72f8f21",
      "donor": "65f0a1b2c3d4e5f678901234",
      "foodName": "Rice Packets",
      "quantity": 25,
      "expiryDate": "2026-03-05T18:00:00.000Z",
      "status": "available",
      "createdAt": "2026-02-27T14:42:56.232Z",
      "updatedAt": "2026-02-27T14:42:56.232Z",
      "__v": 0
    }
  ]
}
```

---

### 2) Create Donation

- **Method:** `POST`
- **URL:** `http://localhost:5000/donations`
- **Headers:** `Content-Type: application/json`

#### Request Body

```json
{
  "donor": "65f0a1b2c3d4e5f678901234",
  "foodName": "Fresh Sandwiches",
  "quantity": 55250,
  "expiryDate": "2026-03-31T18:00:00.000Z",
  "status": "available"
}
```

#### Success Response (201)

```json
{
  "success": true,
  "message": "Donation created successfully",
  "data": {
    "donor": "65f0a1b2c3d4e5f678901234",
    "foodName": "Fresh Sandwiches",
    "quantity": 55250,
    "expiryDate": "2026-03-31T18:00:00.000Z",
    "status": "available",
    "_id": "69a1b159e9592869b2ce2ae4",
    "createdAt": "2026-02-27T14:59:37.908Z",
    "updatedAt": "2026-02-27T14:59:37.908Z",
    "__v": 0
  }
}
```

---

### 3) Update Donation

- **Method:** `PUT`
- **URL:** `http://localhost:5000/donations/69a1b159e9592869b2ce2ae4`
- **Headers:** `Content-Type: application/json`

#### Request Body

```json
{
  "donor": "65f0a1b2c3d4e5f678901234",
  "foodName": "Fresh Sandwiches125",
  "quantity": 552,
  "expiryDate": "2026-03-31T18:00:00.000Z",
  "status": "available"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Donation updated successfully",
  "data": {
    "_id": "69a1b159e9592869b2ce2ae4",
    "donor": "65f0a1b2c3d4e5f678901234",
    "foodName": "Fresh Sandwiches125",
    "quantity": 552,
    "expiryDate": "2026-03-31T18:00:00.000Z",
    "status": "available",
    "createdAt": "2026-02-27T14:59:37.908Z",
    "updatedAt": "2026-02-27T15:01:04.036Z",
    "__v": 0
  }
}
```

---

### 4) Delete Donation

- **Method:** `DELETE`
- **URL:** `http://localhost:5000/donations/69a1b159e9592869b2ce2ae4`
- **Headers:** `Content-Type: application/json`

#### Success Response (200)

```json
{
  "success": true,
  "message": "Donation deleted successfully"
}
```

---

## Donation Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| donor | ObjectId (string) | Yes | References `User` |
| foodName | string | Yes | Trimmed string |
| quantity | number | Yes | Minimum: `1` |
| expiryDate | ISO date string | Yes | Example: `2026-03-31T18:00:00.000Z` |
| status | string | No | One of: `available`, `reserved`, `collected`, `expired` |

---

## Postman

Postman collection file is available at:

- `postman/SharePlate-Donations.postman_collection.json`

Import this file into Postman to run all documented requests directly.

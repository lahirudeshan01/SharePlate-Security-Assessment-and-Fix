const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SharePlate Food Donation API",
      version: "1.0.0",
      description: "API for managing food donations, requests, and pickups between donors and shelters",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64abc123" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", enum: ["donor", "shelter"], example: "donor" },
            organizationName: { type: "string", example: "Food Bank NGO" }
          }
        },
        Donation: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64abc456" },
            foodName: { type: "string", example: "Rice" },
            quantity: { type: "integer", example: 10 },
            expiryDate: { type: "string", format: "date", example: "2026-03-01" },
            status: { type: "string", enum: ["available", "requested", "approved", "completed"], example: "available" },
            location: {
              type: "object",
              properties: {
                address: { type: "string", example: "123 Main St" },
                lat: { type: "number", example: 6.9271 },
                lng: { type: "number", example: 79.8612 }
              }
            },
            donor: { type: "string", example: "64abc123" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Request: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64abc789" },
            donation: { type: "string", example: "64abc456" },
            shelter: { type: "string", example: "64abc123" },
            foodName: { type: "string", example: "Rice" },
            requestedQuantity: { type: "integer", example: 5 },
            message: { type: "string", example: "Needed urgently" },
            status: { type: "string", enum: ["pending", "approved", "rejected"], example: "pending" },
            deliveryStatus: { type: "string", enum: ["not_scheduled", "scheduled", "in-progress", "completed", "cancelled"], example: "not_scheduled" },
            deliveryIssue: { type: "string", example: null },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Pickup: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64abcabc" },
            request: { type: "string", example: "64abc789" },
            scheduledTime: { type: "string", format: "date-time", example: "2026-03-01T10:00:00Z" },
            status: { type: "string", enum: ["scheduled", "in-progress", "completed", "cancelled"], example: "scheduled" },
            notes: { type: "string", example: "Call before arriving" },
            createdAt: { type: "string", format: "date-time" }
          }
        }
      }
    },
    tags: [
      { name: "Authentication", description: "Register, login, and profile" },
      { name: "Donations", description: "Donation CRUD" },
      { name: "Requests", description: "Request creation and approval" },
      { name: "Pickups", description: "Pickup scheduling and status" }
    ]
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsDoc(options);

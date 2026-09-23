const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new food request (Shelter only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donationId, requestedQuantity, foodName]
 *             properties:
 *               donationId:
 *                 type: string
 *                 example: 64abc456
 *               foodName:
 *                 type: string
 *                 example: Rice
 *               requestedQuantity:
 *                 type: integer
 *                 example: 5
 *               message:
 *                 type: string
 *                 example: Needed urgently for 50 people
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Donation not available or validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("shelter"),
  [
    body("donationId")
      .notEmpty().withMessage("Donation ID is required")
      .isMongoId().withMessage("Invalid donation ID"),
    body("requestedQuantity")
      .notEmpty().withMessage("Requested quantity is required")
      .isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("foodName")
      .notEmpty().withMessage("Food name is required")
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage("Food name must be between 2 and 100 characters"),
    body("message")
      .optional()
      .isLength({ max: 500 }).withMessage("Message must be less than 500 characters"),
    validate
  ],
  requestController.createRequest
);

/**
 * @swagger
 * /api/requests/{id}/approve:
 *   put:
 *     summary: Approve a request (Donor only) - sends email notification to shelter
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request approved, other requests auto-rejected, email sent to shelter
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put(
  "/:id/approve",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  requestController.approveRequest
);

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   put:
 *     summary: Reject a request (Donor only) - sends email notification to shelter
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request rejected, email sent to shelter
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put(
  "/:id/reject",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  requestController.rejectRequest
);

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Update a pending request (Shelter only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodName:
 *                 type: string
 *                 example: Rice
 *               requestedQuantity:
 *                 type: integer
 *                 example: 3
 *               message:
 *                 type: string
 *                 example: Updated message
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       400:
 *         description: Cannot update non-pending request
 *       403:
 *         description: Not authorized
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("shelter"),
  [
    body("requestedQuantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("foodName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Food name must be between 2 and 100 characters"),
    body("message").optional().isLength({ max: 500 }).withMessage("Message must be less than 500 characters"),
    validate
  ],
  requestController.updateRequest
);

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     summary: Delete a pending request (Shelter only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *       400:
 *         description: Cannot delete non-pending request
 *       403:
 *         description: Not authorized
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("shelter"),
  requestController.deleteRequest
);

/**
 * @swagger
 * /api/requests/my-requests:
 *   get:
 *     summary: Get all requests made by the logged-in shelter
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shelter requests
 */
router.get(
  "/my-requests",
  authMiddleware,
  authorizeRoles("shelter"),
  requestController.getMyRequests
);

/**
 * @swagger
 * /api/requests/my-approved-requests:
 *   get:
 *     summary: Get approved requests with delivery status (Shelter - table display)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approved requests with deliveryStatus and deliveryIssue fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                       foodName:
 *                         type: string
 *                       deliveryStatus:
 *                         type: string
 *                         enum: [not_scheduled, scheduled, in-progress, completed, cancelled]
 *                       deliveryIssue:
 *                         type: string
 *                         nullable: true
 */
router.get(
  "/my-approved-requests",
  authMiddleware,
  authorizeRoles("shelter"),
  requestController.getMyApprovedRequests
);

/**
 * @swagger
 * /api/requests/my-donations:
 *   get:
 *     summary: Get all requests on the donor's donations
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests for donor donations
 */
router.get(
  "/my-donations",
  authMiddleware,
  authorizeRoles("donor", "restaurant"),
  requestController.getRequestsForMyDonations
);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests (all authenticated users)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All requests
 */
router.get(
  "/",
  authMiddleware,
  requestController.getAllRequests
);

/**
 * @swagger
 * /api/requests/donation/{donationId}:
 *   get:
 *     summary: Get all requests for a specific donation
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: donationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Requests for the donation
 *       400:
 *         description: Invalid donation ID
 */
router.get(
  "/donation/:donationId",
  authMiddleware,
  requestController.getRequestsByDonation
);

module.exports = router;
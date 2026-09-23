const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All delivery routes require authentication
router.use(authMiddleware);

// GET all deliveries — manager or admin only
router.get(
  "/getalldelivery",
  authorizeRoles("manager", "admin"),
  deliveryController.getAllDeliveries
);

// POST confirm a delivery — manager or admin only
router.post(
  "/confirm",
  authorizeRoles("manager", "admin"),
  deliveryController.confirmDelivery
);

// PUT start a delivery — manager or admin only
router.put(
  "/start/:deliveryId",
  authorizeRoles("manager", "admin"),
  deliveryController.startDelivery
);

// PUT complete a delivery — manager or admin only
router.put(
  "/complete/:deliveryId",
  authorizeRoles("manager", "admin"),
  deliveryController.completeDelivery
);

// DELETE cancel a delivery — manager or admin only
router.delete(
  "/cancel/:deliveryId",
  authorizeRoles("manager", "admin"),
  deliveryController.cancelDelivery
);

module.exports = router;

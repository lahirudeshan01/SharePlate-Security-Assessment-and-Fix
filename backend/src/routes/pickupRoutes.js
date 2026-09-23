const express = require("express");
const router = express.Router();
const pickupController = require("../controllers/pickupController");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// ── Manager routes ──────────────────────────────────────────────

// GET /api/pickups — all pickups (manager)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("manager", "admin"),
  pickupController.getAllPickups
);

// GET /api/pickups/approved-requests — approved requests awaiting pickup (manager)
router.get(
  "/approved-requests",
  authMiddleware,
  authorizeRoles("manager", "admin"),
  pickupController.getApprovedRequests
);

// GET /api/pickups/:id — single pickup (manager)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("manager", "admin"),
  pickupController.getPickupById
);

// PUT /api/pickups/:id — update scheduled time/notes (manager)
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("manager", "admin"),
  pickupController.updatePickup
);

// ── Donor / shared routes ───────────────────────────────────────

// POST /api/pickups — schedule a pickup (donor or manager)
router.post(
  "/schedule",
  authMiddleware,
  authorizeRoles("donor", "manager", "admin"),
  pickupController.schedulePickup
);

// PUT /api/pickups/:id/complete — mark completed (donor or manager)
router.put(
  "/:id/complete",
  authMiddleware,
  authorizeRoles("donor", "manager", "admin"),
  pickupController.completePickup
);

// PUT /api/pickups/:id/cancel — cancel a pickup (donor or manager)
router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("donor", "manager", "admin"),
  pickupController.cancelPickup
);

module.exports = router;

const Pickup = require("../models/Pickup");
const Request = require("../models/Request");
const Donation = require("../models/Donation");

// Get all pickups (manager)
exports.getAllPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate({
        path: "request",
        populate: [
          { path: "donation", select: "foodName quantity expiryDate pickupAddress" },
          { path: "shelter", select: "name email organizationName phone" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: pickups.length, pickups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single pickup by id (manager)
exports.getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate({
      path: "request",
      populate: [
        { path: "donation", select: "foodName quantity expiryDate pickupAddress" },
        { path: "shelter", select: "name email organizationName phone" },
      ],
    });

    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup not found" });
    }

    res.status(200).json({ success: true, pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update pickup scheduled time/notes (manager)
exports.updatePickup = async (req, res) => {
  try {
    const { scheduledTime, notes } = req.body;
    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup not found" });
    }

    if (pickup.status === "completed" || pickup.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${pickup.status} pickup`,
      });
    }

    if (scheduledTime) pickup.scheduledTime = scheduledTime;
    if (notes !== undefined) pickup.notes = notes;

    await pickup.save();

    res.status(200).json({ success: true, message: "Pickup updated", pickup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get approved requests that need a pickup scheduled (manager)
exports.getApprovedRequests = async (req, res) => {
  try {
    const requests = await Request.find({ status: "approved" })
      .populate("donation", "foodName quantity expiryDate pickupAddress")
      .populate("shelter", "name email organizationName phone")
      .sort({ updatedAt: -1 });

    // Filter out requests that already have an active pickup
    const activePickups = await Pickup.find({
      status: { $in: ["scheduled", "in-progress"] },
    }).select("request");

    const activeRequestIds = new Set(activePickups.map((p) => p.request.toString()));

    const pendingRequests = requests.filter(
      (r) => !activeRequestIds.has(r._id.toString())
    );

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Schedule Pickup
exports.schedulePickup = async (req, res) => {
  try {
    const { requestId, scheduledTime, notes } = req.body;

    // Check if request exists and is approved
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status !== "approved") {
      return res.status(400).json({ success: false, message: "Request is not approved" });
    }

    // Prevent multiple pickups for same request
    const existingPickup = await Pickup.findOne({ request: requestId });

    if (existingPickup && existingPickup.status !== "cancelled") {
      return res.status(400).json({ success: false, message: "Pickup already scheduled" });
    }

    const pickup = await Pickup.create({
      request: requestId,
      scheduledTime,
      notes
    });

    // Sync delivery status back to the request
    request.deliveryStatus = "scheduled";
    request.deliveryIssue = null;
    await request.save();

    res.status(201).json({ success: true, message: "Pickup scheduled successfully", pickup });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Complete pickup and update donation status to completed
exports.completePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate({
        path: "request",
        populate: { path: "donation" }
      });

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }

    pickup.status = "completed";
    await pickup.save();

    // Sync pickup status back to the request
    await Request.findByIdAndUpdate(pickup.request._id, { deliveryStatus: "completed", deliveryIssue: null });

    // Also update donation status
    if (pickup.request && pickup.request.donation) {
      pickup.request.donation.status = "completed";
      await pickup.request.donation.save();
    }

    res.status(200).json({ success: true, message: "Pickup completed", pickup });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a pickup and record an issue message on the request
exports.cancelPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate("request");

    if (!pickup) {
      return res.status(404).json({ success: false, message: "Pickup not found" });
    }

    if (pickup.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed pickup" });
    }

    const { issueMessage } = req.body;

    pickup.status = "cancelled";
    await pickup.save();

    // Sync cancellation and issue message back to the request
    await Request.findByIdAndUpdate(pickup.request._id, {
      deliveryStatus: "cancelled",
      deliveryIssue: issueMessage || "Pickup was cancelled. Please reschedule."
    });

    res.status(200).json({
      success: true,
      message: "Pickup cancelled",
      issueRecorded: issueMessage || "Pickup was cancelled. Please reschedule.",
      pickup
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
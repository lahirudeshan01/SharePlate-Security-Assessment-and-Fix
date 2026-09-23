const Request = require("../models/Request");
const Donation = require("../models/Donation");
const mongoose = require("mongoose");
const { sendApprovalEmail, sendRejectionEmail } = require("../config/emailService");

exports.createRequest = async (req, res) => {
  try {
    const { donationId, message, requestedQuantity, foodName } = req.body;
    const shelterId = req.user._id; // Get from authenticated user

    const donation = await Donation.findById(donationId);

    if (!donation || donation.status !== "available") {
      return res.status(400).json({ 
        success: false,
        message: "Donation not available" 
      });
    }

    // Validate requested quantity doesn't exceed available quantity
    if (requestedQuantity > donation.quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${requestedQuantity}) exceeds available quantity (${donation.quantity})`
      });
    }

    // Check if shelter already requested this donation
    const existingRequest = await Request.findOne({
      donation: donationId,
      shelter: shelterId,
      status: { $in: ["pending", "approved"] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already requested this donation"
      });
    }

    const request = await Request.create({
      donation: donationId,
      shelter: shelterId,
      message: message,
      requestedQuantity: requestedQuantity,
      foodName: foodName
    });

    // Donation stays "available" until a request is approved
    // Other shelters can still request it

    res.status(201).json({
      success: true,
      message: "Request created successfully",
      request
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Approve a request and auto-reject others for the same donation
exports.approveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("donation")
      .populate("shelter", "name email");

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    // Verify the donor owns this donation
    if (request.donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this request"
      });
    }

    // Approve the request
    request.status = "approved";
    await request.save();

    // Update donation status to reserved and record who reserved it
    request.donation.status = "reserved";
    request.donation.reservedBy = request.shelter;
    request.donation.reservedAt = new Date();
    await request.donation.save();

    // Auto reject other pending requests for the same donation
    await Request.updateMany(
      {
        donation: request.donation._id,
        _id: { $ne: request._id },
        status: "pending"
      },
      {
        status: "rejected"
      }
    );

    // Send approval email notification to shelter (third-party: Nodemailer)
    await sendApprovalEmail({
      shelterEmail: request.shelter.email,
      shelterName: request.shelter.name,
      foodName: request.foodName,
      quantity: request.requestedQuantity,
      donorName: req.user.name || req.user.organizationName || "Donor",
    });

    res.status(200).json({ 
      success: true,
      message: "Request approved and other requests rejected",
      request 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

//Reject a request and make donation available again
exports.rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("donation")
      .populate("shelter", "name email");

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    // Verify the donor owns this donation
    if (request.donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this request"
      });
    }

    request.status = "rejected";
    await request.save();

    // Check if there are other pending requests
    const pendingRequests = await Request.find({
      donation: request.donation._id,
      status: "pending"
    });

    // If no pending requests, make donation available again
    if (pendingRequests.length === 0) {
      request.donation.status = "available";
      await request.donation.save();
    }

    // Send rejection email notification to shelter (third-party: Nodemailer)
    await sendRejectionEmail({
      shelterEmail: request.shelter.email,
      shelterName: request.shelter.name,
      foodName: request.foodName,
    });

    res.status(200).json({ 
      success: true,
      message: "Request rejected",
      request 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update a request (shelter can update their own pending request)
exports.updateRequest = async (req, res) => {
  try {
    const { message, requestedQuantity, foodName } = req.body;
    const request = await Request.findById(req.params.id).populate("donation");

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    // Verify the shelter owns this request
    if (request.shelter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this request"
      });
    }

    // Only allow updating pending requests
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${request.status} request. Only pending requests can be updated.`
      });
    }

    // Update the message
    if (message !== undefined) {
      request.message = message;
    }

    // Update the food name
    if (foodName !== undefined) {
      request.foodName = foodName;
    }

    // Update the requested quantity
    if (requestedQuantity !== undefined) {
      // Validate requested quantity doesn't exceed donation quantity
      if (requestedQuantity > request.donation.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity (${requestedQuantity}) exceeds available quantity (${request.donation.quantity})`
        });
      }
      
      if (requestedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1"
        });
      }
      
      request.requestedQuantity = requestedQuantity;
    }

    await request.save();

    res.status(200).json({ 
      success: true,
      message: "Request updated successfully",
      request 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete a request (shelter can delete their own pending request)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("donation");

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    // Verify the shelter owns this request
    if (request.shelter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this request"
      });
    }

    // Only allow deleting pending requests
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${request.status} request. Only pending requests can be deleted.`
      });
    }

    const donationId = request.donation._id;

    // Delete the request
    await Request.findByIdAndDelete(req.params.id);

    // Check if there are any other pending requests for this donation
    const pendingRequests = await Request.countDocuments({
      donation: donationId,
      status: "pending"
    });

    // If no pending requests, make donation available again
    if (pendingRequests === 0) {
      await Donation.findByIdAndUpdate(donationId, { status: "available" });
    }

    res.status(200).json({ 
      success: true,
      message: "Request deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// View all requests for a specific donation
exports.getRequestsByDonation = async (req, res) => {
  try {
    const { donationId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid donation ID" 
      });
    }

    const requests = await Request.find({ donation: donationId })
      .populate("shelter", "name email organizationName")
      .populate("donation", "foodName quantity status");

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all requests for the logged-in shelter
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ shelter: req.user._id })
      .populate("donation", "foodName quantity status expiryDate location")
      .populate({
        path: "donation",
        populate: {
          path: "donor",
          select: "name email organizationName"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all requests for the logged-in donor's donations
exports.getRequestsForMyDonations = async (req, res) => {
  try {
    // Find all donations by this donor
    const donations = await Donation.find({ donor: req.user._id });
    const donationIds = donations.map(d => d._id);

    // Find all requests for these donations
    const requests = await Request.find({ donation: { $in: donationIds } })
      .populate("shelter", "name email organizationName")
      .populate("donation", "foodName quantity status expiryDate")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all requests (admin view)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("shelter", "name email organizationName")
      .populate({
        path: "donation",
        populate: {
          path: "donor",
          select: "name email organizationName"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get approved requests with pickup information for table display
exports.getMyApprovedRequests = async (req, res) => {
  try {
    const Pickup = require("../models/Pickup");
    
    // Find all approved requests for this shelter
    const approvedRequests = await Request.find({ 
      shelter: req.user._id,
      status: "approved"
    })
      .populate("donation", "foodName quantity status expiryDate location")
      .populate({
        path: "donation",
        populate: {
          path: "donor",
          select: "name email organizationName"
        }
      })
      .sort({ createdAt: -1 });

    // For each request, get pickup information
    const requestsWithPickup = await Promise.all(
      approvedRequests.map(async (request) => {
        const pickup = await Pickup.findOne({ request: request._id })
          .select("scheduledTime status notes");

        return {
          requestId: request._id,
          foodName: request.foodName,
          requestedQuantity: request.requestedQuantity,
          availableQuantity: request.donation?.quantity || 0,
          donorName: request.donation?.donor?.name || request.donation?.donor?.organizationName || "N/A",
          donorEmail: request.donation?.donor?.email || "N/A",
          location: request.donation?.location?.address || "N/A",
          expiryDate: request.donation?.expiryDate,
          status: request.status,
          deliveryStatus: pickup ? pickup.status : (request.deliveryStatus || "not_scheduled"),
          pickupTime: pickup ? pickup.scheduledTime : null,
          pickupNotes: pickup ? pickup.notes : null,
          deliveryIssue: request.deliveryIssue || null,
          message: request.message,
          createdAt: request.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: requestsWithPickup.length,
      requests: requestsWithPickup
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
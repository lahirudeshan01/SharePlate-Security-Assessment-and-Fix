const Donation = require("../models/Donation");

//Create a new donation
exports.createDonation = async (req, res) => {
  try {
    const { foodName, quantity, expiryDate, location, pickupAddress, description } = req.body;
    const donorId = req.user._id; // Get from authenticated user

    const donation = await Donation.create({
      foodName,
      quantity,
      donor: donorId,
      expiryDate,
      location,
      pickupAddress,
      description,
      status: "available"
    });

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      donation
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get available donations (filter out expired)
exports.getAvailableDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ 
      status: "available",
      expiryDate: { $gt: new Date() }
    })
      .populate("donor", "name email organizationName location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Public: get all donations
exports.getPublicDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donor", "name email organizationName location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all donations by the logged-in donor
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single donation by ID
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donor", "name email organizationName location");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found"
      });
    }

    res.status(200).json({
      success: true,
      donation
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid donation ID format' });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all donations (for admin or general view)
exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donor", "name email organizationName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a donation (donor can update their own)
exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found"
      });
    }

    // Verify the donor owns this donation
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this donation"
      });
    }

    // Only allow updating available donations
    if (donation.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${donation.status} donation`
      });
    }

    const { foodName, quantity, expiryDate, location, pickupAddress, description } = req.body;

    if (foodName !== undefined) donation.foodName = foodName;
    if (quantity !== undefined) donation.quantity = quantity;
    if (expiryDate !== undefined) donation.expiryDate = expiryDate;
    if (location !== undefined) donation.location = location;
    if (pickupAddress !== undefined) donation.pickupAddress = pickupAddress;
    if (description !== undefined) donation.description = description;

    await donation.save();

    res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a donation (donor can delete their own)
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found"
      });
    }

    // Verify the donor owns this donation
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this donation"
      });
    }

    // Only allow deleting available donations
    if (donation.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a ${donation.status} donation`
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

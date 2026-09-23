const Delivery = require("../models/DeliveryModel");
const Request = require("../models/Request");

exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("requestId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const { requestId, deliverManId, deliveryDetails } = req.body;

    const request = await Request.findById(requestId);
    if (!request || request.status.toLowerCase() !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Request must exist and be approved before confirming delivery",
      });
    }

    const delivery = await Delivery.create({
      requestId,
      deliverManId,
      deliveryDetails,
      status: "confirmed",
    });

    request.deliveryStatus = "confirmed";
    await request.save();

    res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Not found" });

    delivery.status = "in_progress";
    await delivery.save();

    await Request.findByIdAndUpdate(delivery.requestId, {
      deliveryStatus: "in_progress",
    });

    res.json({ message: "Delivery started" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Not found" });

    delivery.status = "completed";
    await delivery.save();

    await Request.findByIdAndUpdate(delivery.requestId, {
      deliveryStatus: "completed",
    });

    res.json({ message: "Delivery completed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Not found" });

    await Request.findByIdAndUpdate(delivery.requestId, {
      deliveryStatus: "cancelled",
    });

    await Delivery.findByIdAndDelete(deliveryId);

    res.json({ message: "Delivery cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

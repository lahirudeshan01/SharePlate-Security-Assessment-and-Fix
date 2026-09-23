const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    deliverManId: {
      type: String,
      required: true,
    },
    deliveryDetails: {
      type: String,
    },
    status: {
      type: String,
      enum: ["confirmed", "in_progress", "completed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Delivery", deliverySchema);

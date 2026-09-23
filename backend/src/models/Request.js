const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true,
  },

  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  requestedQuantity: {
    type: Number,
    required: [true, "Requested quantity is required"],
    min: [1, "Quantity must be at least 1"]
  },

  foodName: {
    type: String,
    required: [true, "Food name is required"],
    trim: true
  },

  message: {
    type: String,
    maxlength: 500,
  },

  deliveryStatus: {
    type: String,
    enum: ["not_scheduled", "scheduled", "in-progress", "completed", "cancelled"],
    default: "not_scheduled",
  },

  deliveryIssue: {
    type: String,
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);

const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: [true, 'Please provide a scheduled time'],
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled',
    },
    notes: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("Pickup", pickupSchema);
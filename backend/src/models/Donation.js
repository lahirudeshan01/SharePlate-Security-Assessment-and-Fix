const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    donor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    foodName: String,
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    quantity: Number,
    
    pickupAddress: {
        type: String,
        trim: true,
    },

    expiryDate: {
        type: Date,
        required: [true, 'Please provide an expiry date'],
    },

    status:{
        type:String,
        enum: ["available", "reserved", "collected", "completed", "expired"],
        default: "available"
    },

    location: {
        address: String,
        lat: Number,
        lng: Number,
    },

    reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    reservedAt: {
        type: Date,
        default: null,
    },

}, {timestamps: true});
    

module.exports= mongoose.model("Donation", donationSchema);
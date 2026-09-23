const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type:String,
        required:[true, "Email is required"],
        unique: true,
        match:[/^\S+@\S+\.\S+$/,
      "Please enter a valid email"]
    },
    password:{
        type: String,
        required: [true, "Password is required"]
    },

    role: {
        type:String,
        required: true,
        enum: {
            values: ["donor", "shelter", "admin", "manager"],
            message: "Role must be donor, shelter, admin, or manager"
        }
    },

    organizationName:{
        type: String, 
    },

    phone: {
        type: String,
    },

    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },

    preciseLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    location: {
        address: String,
        lat: Number,
        lng: Number,
    },

}, {timestamps: true});

module.exports= mongoose.model("User", userSchema);

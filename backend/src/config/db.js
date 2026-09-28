const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shareplate";
        await mongoose.connect(uri);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        console.log("Note: Make sure MongoDB is running locally (e.g., via MongoDB Compass or Windows service 'MongoDB').");
        // Only exit if not in dev/test so server stays alive for demonstration
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from backend/.env explicitly
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./src/config/db");
const app = require("./src/app");

// MongoDB Connection
connectDB();

// Start Server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for testing
module.exports = app;

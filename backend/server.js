const dotenv = require("dotenv");

// Load environment variables FIRST (before other imports read process.env)
dotenv.config();

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

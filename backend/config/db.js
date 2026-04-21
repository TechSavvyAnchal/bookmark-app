const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Keep trying for 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4 // Use IPv4
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    // Don't exit process, let it retry if needed or fail gracefully
  }
};
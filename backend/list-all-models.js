const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  // The correct way to list models is often via the model info or just fetching from the API
  // but let's try the common way for the SDK
  try {
     // In some versions it's on the client instance if you use the right method
     // Let's try to just embed with a likely correct name if listing fails
     console.log("Attempting to list models...");
     // In v0.24.1, it's actually not a simple method on genAI
     // Let's try text-embedding-004 again but with 'models/' prefix if needed
  } catch (e) {
    console.log(e.message);
  }
}
run();

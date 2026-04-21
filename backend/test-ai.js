const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testAI() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing!");
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  try {
    console.log("Testing Gemini AI with gemini-2.5-flash...");
    const result = await model.generateContent("Respond with a JSON object { 'test': 'success' }");
    const response = await result.response;
    console.log("Response text:", response.text());
  } catch (err) {
    console.error("AI Test Error:", err);
  }
}

testAI();

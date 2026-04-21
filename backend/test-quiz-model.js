const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const testModel = async () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    console.log("Testing gemini-2.5-flash...");
    const result = await model.generateContent("Hello, are you there?");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (err) {
    console.error("Error with gemini-2.5-flash:", err.message);
  }
};

testModel();

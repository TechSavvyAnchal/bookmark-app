const axios = require("axios");
require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY.trim();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Error listing models:", err.response?.data || err.message);
  }
}

listModels();

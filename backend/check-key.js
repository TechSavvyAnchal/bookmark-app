const axios = require("axios");
require("dotenv").config();

async function checkKey() {
  const key = process.env.GEMINI_API_KEY.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const res = await axios.get(url);
    const names = res.data.models.map(m => m.name);
    console.log("Names containing '1.5':", names.filter(n => n.includes("1.5")));
    console.log("Names containing 'flash':", names.filter(n => n.includes("flash")));
  } catch (err) {
    if (err.response) {
      console.error("Error Response:", err.response.status, err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

checkKey();

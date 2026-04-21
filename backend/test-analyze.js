const axios = require("axios");
require("dotenv").config();

async function testRequest() {
  const url = "http://localhost:5000/links";
  const token = ""; // We need a valid token to test properly, or we can bypass auth for a quick test
  
  // Actually, let's just test the analyzeLink function directly in a script
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  
  const analyzeLink = async (url, title, manualCategory = null) => {
    console.log(`Analyzing link: ${url} (Title: ${title})`);
    if (!process.env.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY not found in environment.");
      return null;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const analyzeWithRetry = async (retries = 3, delay = 2000) => {
      try {
        const prompt = `Analyze this bookmark and respond ONLY with a JSON object containing: 
        1. "summary": A concise 2-sentence summary.
        2. "category": A single word category (e.g., Tech, Design, Productivity, News, Entertainment, Education).
        3. "tags": An array of 3 relevant short tags.
        4. "readTime": Estimated reading time in minutes (number only).
        
        URL: ${url}
        Title: ${title}`;

        console.log("Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        console.log("Gemini Raw Response:", text);
        
        // Find JSON block
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          text = text.substring(start, end + 1);
          const parsed = JSON.parse(text);
          console.log("Successfully parsed JSON:", parsed);
          return parsed;
        }
        console.error("No JSON block found in response");
        throw new Error("No JSON found in response");
      } catch (err) {
        console.error(`Gemini attempt failed: ${err.message}`);
        if (retries > 0) {
          console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return analyzeWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const aiResponse = await analyzeWithRetry();
      return {
        summary: aiResponse.summary,
        category: manualCategory || aiResponse.category,
        tags: aiResponse.tags || [],
        readTime: aiResponse.readTime || 2
      };
    } catch (err) {
      console.error("Gemini AI Analysis Final Error:", err);
      return null;
    }
  };

  const result = await analyzeLink("https://react.dev", "React Documentation");
  console.log("Final Result:", result);
}

testRequest();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require("turndown");
const redisClient = require("../config/redis");

const turndownService = new TurndownService();

const generateEmbedding = async (text) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key missing");
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  
  // Try models in order of preference
  const models = ["text-embedding-004", "embedding-001"];
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      if (result && result.embedding && result.embedding.values) {
        return result.embedding.values;
      }
    } catch (err) {
      console.error(`[AI SERVICE] Embedding with ${modelName} failed:`, err.message);
    }
  }
  
  console.error("[AI SERVICE] All embedding attempts failed.");
  return [];
};

const fetchReaderContent = async (url) => {
  console.log(`[AI SERVICE] Fetching reader content for: ${url}`);
  try {
    const response = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      timeout: 10000 
    });
    
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article) throw new Error("Could not parse article content.");

    return {
      title: article.title,
      content: article.content,
      markdown: turndownService.turndown(article.content),
      textContent: article.textContent,
      siteName: article.siteName
    };
  } catch (err) {
    console.error("[AI SERVICE] Reader Mode Error:", err.message);
    throw err;
  }
};

const generateQuiz = async (url, title, textContent) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Based on the following content from "${title}" (${url}), generate a 3-question multiple choice quiz to test comprehension.
  
  CONTENT:
  ${textContent.substring(0, 5000)}

  Respond ONLY with a JSON array of objects. Each object should have 'question', 'options' (array of strings), and 'answer' (index of the correct option).`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON found in quiz response");
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    console.error("[AI SERVICE] Quiz Generation Error:", err.message);
    throw err;
  }
};

const fetchMetadata = async (url) => {
  try {
    const cacheKey = `metadata:${url}`;
    try {
      if (redisClient.isOpen && redisClient.isReady) {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}

    const response = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000 
    });
    const dom = new JSDOM(response.data);
    const doc = dom.window.document;
    
    const title = doc.querySelector("title")?.textContent || "";
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || 
                        doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
    
    const metadata = { pageTitle: title, pageDescription: description };
    try { 
      if (redisClient.isOpen && redisClient.isReady) {
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(metadata)); 
      }
    } catch (e) {}

    return metadata;
  } catch (err) {
    return { pageTitle: "", pageDescription: "" };
  }
};

const analyzeLink = async (url, title, manualCategory = null, note = "") => {
  const metadata = await fetchMetadata(url);
  if (!process.env.GEMINI_API_KEY) return { summary: "No Key", category: "General", tags: [], embedding: [] };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const prompt = `Analyze this bookmark and respond ONLY with a JSON object containing: 
    1. "summary": A concise 2-sentence summary.
    2. "category": A single word category (e.g., Tech, Design, Productivity, News, Entertainment, Education).
    3. "tags": An array of 3 relevant short tags.
    4. "readTime": Estimated reading time in minutes (NUMBER ONLY, e.g., 5).
    
    URL: ${url}
    Title: ${title}
    Note: ${note}
    Metadata: ${metadata.pageTitle}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    console.log("[AI SERVICE] Raw Response:", text);
    
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    
    const aiResponse = JSON.parse(text.substring(start, end + 1));
    
    // Defensive parsing for readTime
    let readTime = parseInt(aiResponse.readTime);
    if (isNaN(readTime)) readTime = 2;

    const category = manualCategory || aiResponse.category || "General";
    const embeddingText = `Title: ${title} | Category: ${category} | Summary: ${aiResponse.summary} | Tags: ${aiResponse.tags?.join(", ")} | Note: ${note} | Description: ${metadata.pageDescription}`;
    const embedding = await generateEmbedding(embeddingText);

    return { 
      summary: aiResponse.summary || "No summary", 
      category, 
      tags: aiResponse.tags || [], 
      readTime, 
      embedding 
    };
  } catch (err) {
    console.error("[AI SERVICE] Analysis Error Details:", {
      message: err.message,
      stack: err.stack,
      url,
      title
    });
    return { 
      summary: "AI Analysis failed", 
      category: manualCategory || "General", 
      tags: [], 
      readTime: 2, 
      embedding: [] 
    };
  }
};

const chatWithBookmarks = async (question, bookmarks) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const chatModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  const context = bookmarks.map(b => `- ${b.title}: ${b.summary}`).join("\n");
  const prompt = `Question: ${question}\n\nContext:\n${context}`;

  for (const modelName of chatModels) {
    try {
      console.log(`[AI SERVICE] Attempting chat with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error(`[AI SERVICE] Chat with ${modelName} failed:`, err.message);
      // If this is the last model in our list, throw the error
      if (modelName === chatModels[chatModels.length - 1]) throw err;
      // Otherwise, log it and try the next one
      console.log(`[AI SERVICE] Retrying with fallback model...`);
    }
  }
};

module.exports = { analyzeLink, fetchReaderContent, generateQuiz, chatWithBookmarks, generateEmbedding };
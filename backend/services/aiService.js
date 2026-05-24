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
  const models = ["text-embedding-004", "embedding-001", "gemini-embedding-001"];
  
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
    // Fallback to 3.1-flash-lite if 2.5-flash fails
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
      const result = await fallbackModel.generateContent(prompt);
      const resText = result.response.text().trim();
      const start = resText.indexOf("[");
      const end = resText.lastIndexOf("]");
      return JSON.parse(resText.substring(start, end + 1));
    } catch (fallbackErr) {
      throw fallbackErr;
    }
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

const OpenAI = require("openai");

const speculateAnalysis = (url, title, note) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const cleanTitle = title ? title.trim() : "";
    
    let summary = `A resource from ${domain}`;
    if (cleanTitle) summary += ` regarding "${cleanTitle}"`;
    if (note) summary += `. User note: ${note}`;
    summary += `. AI is currently deep-scanning for more details...`;

    return {
      summary,
      category: "Analyzing...",
      tags: [domain.split('.')[0], "new"],
      readTime: 1
    };
  } catch (e) {
    return {
      summary: "AI is analyzing this content...",
      category: "Analyzing...",
      tags: [],
      readTime: 1
    };
  }
};

const analyzeLink = async (url, title, manualCategory = null, note = "") => {
  console.log(`[AI SERVICE] Starting analysis for ${url}`);
  let metadata = { pageTitle: "", pageDescription: "" };
  try {
    metadata = await fetchMetadata(url);
  } catch (e) {
    console.log("[AI SERVICE] Metadata fetch failed");
  }

  const prompt = `Task: Analyze this URL and provide metadata.
  URL: ${url}
  Title: ${title}
  User Note: ${note}
  Scraped Title: ${metadata.pageTitle}

  Response MUST be a valid JSON object with these EXACT keys:
  "summary": 2-sentence summary.
  "category": One word (e.g. Tech, Education, News, Finance).
  "tags": Array of 3 short tags.
  "readTime": Number of minutes.

  JSON:`;

  // 1. PRIORITIZE OPENAI IF KEY EXISTS (Much more stable)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("[AI SERVICE] Attempting OpenAI (GPT-4o-mini)...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        timeout: 10000 // 10 second timeout
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content);
      console.log("[AI SERVICE] OpenAI analysis successful!");
      return { 
        summary: aiResponse.summary || "No summary provided.", 
        category: manualCategory || aiResponse.category || "General", 
        tags: aiResponse.tags || [], 
        readTime: parseInt(aiResponse.readTime) || 2, 
        embedding: [] 
      };
    } catch (err) {
      console.error("[AI SERVICE] OpenAI failed:", err.message);
    }
  }

  // 2. FALLBACK TO GEMINI
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.0-flash"];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI SERVICE] Attempting Gemini fallback: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        
        const aiResponse = JSON.parse(text.substring(start, end + 1));
        console.log(`[AI SERVICE] Gemini ${modelName} successful!`);
        
        let embedding = [];
        try {
           embedding = await generateEmbedding(`Title: ${title} | Summary: ${aiResponse.summary}`);
        } catch (e) {}

        return { 
          summary: aiResponse.summary || "No summary", 
          category: manualCategory || aiResponse.category || "General", 
          tags: aiResponse.tags || [], 
          readTime: parseInt(aiResponse.readTime) || 2, 
          embedding 
        };
      } catch (err) {
        console.error(`[AI SERVICE] Gemini ${modelName} failed:`, err.message);
      }
    }
  }

  console.error("[AI SERVICE] All AI models failed or no keys found.");
  return { 
    summary: "AI analysis failed. Please check your API keys in Render settings.", 
    category: manualCategory || "General", 
    tags: [], 
    readTime: 2, 
    embedding: [] 
  };
};

const chatWithBookmarks = async (question, bookmarks, history = []) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  // Using the latest available models from the list-models output
  const chatModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  const context = bookmarks.length > 0 
    ? bookmarks.map(b => `- [${b.title}] (${b.url}): ${b.summary}${b.tags ? ' | Tags: ' + b.tags.join(', ') : ''}${b.note ? ' | Note: ' + b.note : ''}`).join("\n")
    : "No specific bookmarks found for this query.";

  const systemPrompt = `You are the AI Assistant for "Ask My Bookmarks", a smart bookmarking app. 
Your goal is to help users find information within their saved links and answer questions about the app.

APP FEATURES:
- Adding Links: Users can add URLs to save them. The app automatically generates summaries, tags, and categories.
- Vaults: Users can create private or shared vaults to organize bookmarks with others.
- AI Search: Users can search bookmarks using natural language (semantic search).
- Reader Mode: Clean, distraction-free reading for saved links.
- Quizzes: The app can generate comprehension quizzes for any saved link.
- Weekly Digest: Users receive a weekly email summary of their saved content.
- Browser Extension: A companion extension for quick saving.

GUIDELINES:
1. If the user's question is about their bookmarks, use the provided CONTEXT.
2. If the user asks how to use the app or about its features, use the APP FEATURES list.
3. If the answer is not in the context or features, look for general knowledge but mention if you couldn't find a specific bookmark match.
4. Be concise, professional, and helpful.
5. If the user asks general questions (e.g., "How are you?"), answer them directly.
6. Use the CONVERSATION HISTORY to maintain context for follow-up questions.
- When referencing a bookmark, mention its title and you can even provide the URL if helpful.

FORMATTING:
- Use standard Markdown for bolding (**text**).
- ALWAYS ensure a space exists before and after bolded segments (e.g., "Check out **React** for more info").
- Use bullet points and double line breaks between paragraphs to ensure high readability.
- NEVER clump bolded words together without spaces.
- Do not use excessive bolding; highlight only the most important names, titles, or keywords.
- Use a professional, clean layout with appropriate white space.

CONTEXT FROM USER'S BOOKMARKS:
${context}

CONVERSATION HISTORY:
${history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}
User: ${question}
Assistant:`;

  for (const modelName of chatModels) {
    try {
      console.log(`[AI SERVICE] Attempting chat with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(systemPrompt);
      return result.response.text();
    } catch (err) {
      console.error(`[AI SERVICE] Chat with ${modelName} failed:`, err.message);
      if (modelName === chatModels[chatModels.length - 1]) {
         // If all Gemini models fail, try OpenAI if available
         if (process.env.OPENAI_API_KEY) {
           try {
             console.log("[AI SERVICE] Falling back to OpenAI for chat...");
             const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() });
             const completion = await openai.chat.completions.create({
               model: "gpt-4o-mini",
               messages: [
                 { role: "system", content: "You are the AI Assistant for 'Ask My Bookmarks'." },
                 ...history.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
                 { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` }
               ]
             });
             return completion.choices[0].message.content;
           } catch (openaiErr) {
             console.error("[AI SERVICE] OpenAI fallback failed:", openaiErr.message);
           }
         }
         throw err;
      }
      console.log(`[AI SERVICE] Retrying with fallback model...`);
    }
  }
};

module.exports = { speculateAnalysis, analyzeLink, fetchReaderContent, generateQuiz, chatWithBookmarks, generateEmbedding };

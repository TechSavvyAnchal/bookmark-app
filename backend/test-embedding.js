const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const models = ["models/text-embedding-004", "text-embedding-004", "models/embedding-001", "embedding-001"];
  
  for (const modelName of models) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent("Hello world");
      console.log(`✅ Success with ${modelName}`);
      return;
    } catch (err) {
      console.error(`❌ Failed with ${modelName}: ${err.message}`);
    }
  }
}
test();

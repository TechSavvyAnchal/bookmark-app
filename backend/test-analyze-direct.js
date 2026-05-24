const { analyzeLink } = require("./services/aiService");
require("dotenv").config();

async function test() {
  console.log("Testing analyzeLink directly...");
  const result = await analyzeLink("https://react.dev", "React Documentation");
  console.log("Result:", JSON.stringify(result, null, 2));
}

test();

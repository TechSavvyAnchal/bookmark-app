const { chatWithBookmarks } = require("./services/aiService");
require("dotenv").config();

async function runTest() {
  console.log("--- STARTING CHATBOT LOGIC TEST ---");

  const mockBookmarks = [
    {
      title: "React Documentation",
      url: "https://react.dev",
      summary: "The official documentation for React, a JavaScript library for building user interfaces.",
      tags: ["tech", "frontend", "javascript"],
      note: "Essential for my daily work."
    },
    {
      title: "Healthy Salad Recipes",
      url: "https://example-food.com/salads",
      summary: "A collection of 50 quick and healthy salad recipes for busy professionals.",
      tags: ["health", "food", "cooking"],
      note: "Try the kale Caesar next week."
    }
  ];

  try {
    // Test 1: General question about bookmarks
    console.log("\n[Test 1] Asking: 'What kind of bookmarks do I have?'");
    const response1 = await chatWithBookmarks(
      "What kind of bookmarks do I have?", 
      mockBookmarks,
      []
    );
    console.log("AI Response 1:", response1);

    // Test 2: Follow-up question using history
    const history = [
      { role: "user", text: "What kind of bookmarks do I have?" },
      { role: "bot", text: response1 }
    ];

    console.log("\n[Test 2] Asking follow-up: 'Which one should I use for work?'");
    const response2 = await chatWithBookmarks(
      "Which one should I use for work?",
      mockBookmarks,
      history
    );
    console.log("AI Response 2:", response2);

    // Test 3: App feature question
    console.log("\n[Test 3] Asking about app features: 'How do I add a new link?'");
    const response3 = await chatWithBookmarks(
      "How do I add a new link?",
      [], // No bookmarks needed for this
      []
    );
    console.log("AI Response 3:", response3);

    console.log("\n--- TEST COMPLETE ---");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();

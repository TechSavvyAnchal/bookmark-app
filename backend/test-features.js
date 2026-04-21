const axios = require("axios");

async function testFeatures() {
  try {
    // 1. Signup
    const signupRes = await axios.post("http://localhost:5000/auth/signup", {
      name: "Feature Tester",
      email: `feat_${Date.now()}@example.com`,
      password: "password"
    });
    const token = signupRes.data.token;

    // 2. Add a link that is likely to work with Readability (an article)
    console.log("Adding an article link...");
    const addRes = await axios.post("http://localhost:5000/links", {
      url: "https://web.dev/articles/vitals",
      title: "Web Vitals",
      note: "Testing reader and quiz"
    }, {
      headers: { "x-auth-token": token }
    });
    const linkId = addRes.data._id;
    console.log("Link added:", linkId);

    // 3. Test Reader Mode
    console.log("\nTesting Reader Mode...");
    try {
      const readRes = await axios.get(`http://localhost:5000/links/${linkId}/read`, {
        headers: { "x-auth-token": token }
      });
      console.log("Reader Mode Success! Title:", readRes.data.title);
      console.log("Content preview:", readRes.data.markdown.substring(0, 100) + "...");
    } catch (err) {
      console.error("Reader Mode Failed:", err.response?.data || err.message);
    }

    // 4. Test Quiz Generation
    console.log("\nTesting Quiz Generation...");
    try {
      const quizRes = await axios.post(`http://localhost:5000/links/${linkId}/quiz`, {}, {
        headers: { "x-auth-token": token }
      });
      console.log("Quiz Generation Success! Questions found:", quizRes.data.length);
      console.log("First question:", quizRes.data[0]?.question);
    } catch (err) {
      console.error("Quiz Generation Failed:", err.response?.data || err.message);
    }

    // 5. Test Chat with Bookmarks
    console.log("\nTesting Chat with Bookmarks...");
    try {
      const chatRes = await axios.post(`http://localhost:5000/links/chat`, {
        question: "What is the primary goal of the Web Vitals initiative?"
      }, {
        headers: { "x-auth-token": token }
      });
      console.log("Chat Success! Answer:", chatRes.data.answer.substring(0, 150) + "...");
    } catch (err) {
      console.error("Chat Failed:", err.response?.data || err.message);
    }

  } catch (err) {
    console.error("Setup failed:", err.response?.data || err.message);
  }
}

testFeatures();

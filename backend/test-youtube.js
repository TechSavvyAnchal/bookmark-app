const axios = require("axios");

async function testYouTube() {
  try {
    // 1. Signup/Login to get token
    const signupRes = await axios.post("http://localhost:5000/auth/signup", {
      name: "YT Tester",
      email: `yt_${Date.now()}@example.com`,
      password: "password"
    });
    const token = signupRes.data.token;

    // 2. Add a BTS Video (Dynamite)
    console.log("Adding BTS Video...");
    const res = await axios.post("http://localhost:5000/links", {
      url: "https://www.youtube.com/watch?v=gdZLi9hzHmM", // BTS (방탄소년단) 'Dynamite' Official MV
      title: "BTS Music Video",
      note: "This is a BTS music video for Dynamite"
    }, {
      headers: { "x-auth-token": token }
    });

    console.log("AI Response for BTS Video:");
    console.log(JSON.stringify(res.data, null, 2));

    if (res.data.summary.toLowerCase().includes("bts") || res.data.tags.some(t => t.toLowerCase().includes("bts"))) {
      console.log("\nSUCCESS: AI correctly identified BTS!");
    } else {
      console.log("\nFAILURE: AI missed the BTS context.");
    }
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

testYouTube();

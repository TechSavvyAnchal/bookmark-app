const axios = require("axios");

async function testFlow() {
  const email = `test_${Math.random().toString(36).substring(7)}@example.com`;
  const password = "password123";
  const name = "Test User";

  try {
    console.log(`Step 1: Signing up as ${email}...`);
    const signupRes = await axios.post("http://localhost:5000/auth/signup", {
      name, email, password
    });
    const token = signupRes.data.token;
    console.log("Signup successful, token received:", token);

    console.log("Step 2: Adding a link...");
    const addRes = await axios.post("http://localhost:5000/links", {
      url: "https://nextjs.org",
      title: "Next.js Framework",
      category: "" // Let AI decide
    }, {
      headers: { "x-auth-token": token }
    });

    console.log("Add Link Response:", JSON.stringify(addRes.data, null, 2));

    if (addRes.data.summary && addRes.data.summary.includes("AI analysis failed")) {
      console.error("AI Analysis Failed in response!");
    } else if (addRes.data.category === "General" && !addRes.data.tags.length) {
       console.log("AI might have failed silently or returned defaults.");
    } else {
      console.log("AI Analysis seems to have worked!");
    }
  } catch (err) {
    if (err.response) {
      console.error("Error Response:", err.response.status, JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.error("No Response from server:", err.message);
    } else {
      console.error("Axios Error:", err.message);
    }
  }
}

testFlow();

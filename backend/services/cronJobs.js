const cron = require("node-cron");
const User = require("../models/User");
const Link = require("../models/Link");
const axios = require("axios");
const { sendWeeklyDigest } = require("./emailService");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const checkBrokenLinks = async () => {
  console.log("Checking for broken links...");
  const links = await Link.find({});
  for (const link of links) {
    try {
      await axios.head(link.url, { timeout: 5000 });
      if (link.status !== "active") {
        link.status = "active";
        await link.save();
      }
    } catch (err) {
      console.log(`Link broken: ${link.url}`);
      link.status = "broken";
      await link.save();
    }
  }
};

const generateWeeklyBrief = async (user) => {
  if (!process.env.GEMINI_API_KEY) return null;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentLinks = await Link.find({ 
    user: user._id, 
    createdAt: { $gte: oneWeekAgo } 
  });

  if (recentLinks.length === 0) return null;

  const context = recentLinks.map(l => `- ${l.title}: ${l.summary}`).join("\n");
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Here are the bookmarks I saved this week:\n${context}\n\nSynthesize these into a 3-sentence "Weekly Intelligence Brief". Connect common themes and highlight the most valuable insights.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Brief generation failed:", err);
    return null;
  }
};

const initCronJobs = () => {
  // 1. Weekly Digest Email - Every Sunday at Midnight (0 0 * * 0)
  cron.schedule("0 0 * * 0", async () => {
    console.log("Running weekly digest cron job...");
    try {
      const users = await User.find({});
      for (const user of users) {
        const brief = await generateWeeklyBrief(user);
        if (brief) {
          await sendWeeklyDigest(user, brief);
        }
      }
    } catch (err) {
      console.error("Cron job failed:", err);
    }
  });

  // 2. Daily Broken Link Check - Every Midnight
  cron.schedule("0 0 * * *", async () => {
    await checkBrokenLinks();
  });

  console.log("Cron jobs initialized.");
};

module.exports = { initCronJobs };

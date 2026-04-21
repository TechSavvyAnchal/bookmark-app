const mongoose = require("mongoose");
const router = require("express").Router();
const Link = require("../models/Link");
const Vault = require("../models/Vault");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createLinkSchema, updateLinkSchema } = require("../validators/linkValidator");
const { analyzeLink, fetchReaderContent, generateQuiz, chatWithBookmarks, generateEmbedding } = require("../services/aiService");
const redisClient = require("../config/redis");

// CHAT WITH BOOKMARKS (RAG)
router.post("/chat", auth, async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).send({ msg: "Question is required" });

  const performKeywordRetrieval = async () => {
    console.log(`[CHAT] Performing keyword retrieval for context: "${question}"`);
    // Extract meaningful words (length > 3) to use as search terms
    const keywords = question.split(/\s+/)
      .filter(k => k.length > 3)
      .map(k => k.replace(/[?.,!]/g, ""));
    
    let filter = { user: req.user.id };
    
    if (keywords.length > 0) {
      filter.$or = [
        { title: { $in: keywords.map(k => new RegExp(k, "i")) } },
        { tags: { $in: keywords.map(k => new RegExp(k, "i")) } },
        { summary: { $in: keywords.map(k => new RegExp(k, "i")) } }
      ];
    }

    // Get up to 15 relevant bookmarks
    return await Link.find(filter).limit(15);
  };

  try {
    // 1. Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      const relevantLinks = await performKeywordRetrieval();
      const answer = await chatWithBookmarks(question, relevantLinks);
      return res.send({ answer });
    }

    // 2. Retrieve top relevant links using vector search (RAG)
    const userVaults = await Vault.find({ members: req.user.id });
    const vaultIds = userVaults.map(v => v._id);

    try {
      const relevantLinks = await Link.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 10
          }
        },
        {
          $match: {
            $or: [
              { user: new mongoose.Types.ObjectId(req.user.id) },
              { vault: { $in: vaultIds } }
            ]
          }
        }
      ]);

      if (relevantLinks.length === 0) {
        // Try keyword fallback if vector search finds nothing
        const fallbackLinks = await performKeywordRetrieval();
        const answer = await chatWithBookmarks(question, fallbackLinks);
        return res.send({ answer });
      }

      const answer = await chatWithBookmarks(question, relevantLinks);
      res.send({ answer });
    } catch (vectorErr) {
      console.log("[CHAT] Vector search failed, falling back to keywords:", vectorErr.message);
      const fallbackLinks = await performKeywordRetrieval();
      const answer = await chatWithBookmarks(question, fallbackLinks);
      res.send({ answer });
    }
  } catch (err) {
    console.error("Chat route error:", err.message);
    try {
      // FINAL FALLBACK: If AI fails completely, return the titles of the links found
      const fallbackLinks = await Link.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5);

      const linkList = fallbackLinks.map(l => `• ${l.title}`).join("\n");
      res.send({ 
        answer: `I'm currently experiencing high demand and couldn't generate a summary, but based on your library, these might be relevant:\n\n${linkList}` 
      });
    } catch (e) {
      res.status(500).send({ msg: "Chat failed. Please try again later." });
    }
  }
});

// CREATE LINK
router.post("/", auth, validate(createLinkSchema), async (req, res) => {
  try {
    const { url, title, category, note, vault } = req.body;
    console.log(`[LINK] Creating link for user ${req.user.id}: ${url}`);

    let ai;
    try {
      ai = await analyzeLink(url, title, category, note);
    } catch (aiErr) {
      console.error("[LINK] AI Analysis failed:", aiErr.message);
      ai = { summary: "AI Analysis failed", category: category || "General", tags: [], readTime: 2, embedding: [] };
    }
    
    const link = await Link.create({
      ...req.body,
      ...ai,
      user: req.user.id,
      vault: vault || undefined
    });

    console.log(`[LINK] Successfully created link: ${link._id}`);
    
    // Invalidate analytics cache
    try { 
      if (redisClient.isOpen && redisClient.isReady) {
        await redisClient.del(`analytics:${req.user.id}`); 
      }
    } catch (e) {}

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      if (link.vault) {
        io.to(`vault_${link.vault}`).emit("linkUpdate", { action: "create", link });
      } else {
        io.to(`user_${req.user.id}`).emit("linkUpdate", { action: "create", link });
      }
    }

    res.send(link);
  } catch (err) {
    console.error("[LINK] Create Error:", err.message);
    res.status(500).send({ msg: "Failed to create link", error: err.message });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).send("Not found");
    
    if (link.user.toString() !== req.user.id) {
      if (link.vault) {
        const vault = await Vault.findById(link.vault);
        if (!vault || !vault.members.includes(req.user.id)) return res.status(401).send("Unauthorized");
      } else return res.status(401).send("Unauthorized");
    }

    const vaultId = link.vault;
    await Link.findByIdAndDelete(req.params.id);
    
    // Invalidate analytics cache
    try { 
      if (redisClient.isOpen && redisClient.isReady) {
        await redisClient.del(`analytics:${req.user.id}`); 
      }
    } catch (e) {}

    const io = req.app.get("io");
    if (vaultId) {
      io.to(`vault_${vaultId}`).emit("linkUpdate", { action: "delete", linkId: req.params.id });
    } else {
      io.to(`user_${req.user.id}`).emit("linkUpdate", { action: "delete", linkId: req.params.id });
    }

    res.send("Deleted");
  } catch (err) {
    res.status(500).send("Delete failed");
  }
});

// UPDATE LINK
router.put("/:id", auth, validate(updateLinkSchema), async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).send("Not found");

    if (link.user.toString() !== req.user.id) {
      if (link.vault) {
        const vault = await Vault.findById(link.vault);
        if (!vault || !vault.members.includes(req.user.id)) return res.status(401).send("Unauthorized");
      } else return res.status(401).send("Unauthorized");
    }

    const updatedLink = await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Invalidate analytics cache
    try { 
      if (redisClient.isOpen && redisClient.isReady) {
        await redisClient.del(`analytics:${req.user.id}`); 
      }
    } catch (e) {}

    const io = req.app.get("io");
    if (updatedLink.vault) {
      io.to(`vault_${updatedLink.vault}`).emit("linkUpdate", { action: "update", link: updatedLink });
    } else {
      io.to(`user_${req.user.id}`).emit("linkUpdate", { action: "update", link: updatedLink });
    }

    res.send(updatedLink);
  } catch (err) {
    res.status(500).send("Update failed");
  }
});

// ANALYTICS (with Redis Caching)
router.get("/analytics", auth, async (req, res) => {
  try {
    const cacheKey = `analytics:${req.user.id}`;
    try {
      if (redisClient.isOpen && redisClient.isReady) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) return res.send(JSON.parse(cachedData));
      }
    } catch (e) {}

    const personalLinks = await Link.find({ user: req.user.id });
    const userVaults = await Vault.find({ members: req.user.id });
    const vaultIds = userVaults.map(v => v._id);
    const vaultLinks = await Link.find({ vault: { $in: vaultIds } });
    const allLinks = [...personalLinks, ...vaultLinks];
    const links = Array.from(new Map(allLinks.map(l => [l._id.toString(), l])).values());

    const tagCount = {};
    const categoryCount = {};
    const activityMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      activityMap[d.toISOString().split('T')[0]] = 0;
    }

    links.forEach(l => {
      if (l.tags) l.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1);
      if (l.category) categoryCount[l.category] = (categoryCount[l.category] || 0) + 1;
      if (l.createdAt) {
        const dateStr = new Date(l.createdAt).toISOString().split('T')[0];
        if (activityMap.hasOwnProperty(dateStr)) activityMap[dateStr]++;
      }
    });

    const analyticsData = {
      total: links.length,
      tagCount,
      categoryCount,
      weeklyActivity: Object.entries(activityMap).map(([date, count]) => ({
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count
      }))
    };

    try { 
      if (redisClient.isOpen && redisClient.isReady) {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(analyticsData)); 
      }
    } catch (e) {}

    res.send(analyticsData);
  } catch (err) {
    res.status(500).send("Analytics failed");
  }
});

// SEARCH (Semantic)
router.post("/search", auth, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.send([]);

  const performFallbackSearch = async () => {
    console.log(`[SEARCH] Performing human-language keyword search for: "${query}"`);
    
    // 1. Natural Language Processing: Filter stop words
    const stopWords = new Set(["a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "to", "of", "and", "or", "but", "in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "please", "find", "me", "show", "get", "give", "links", "about"]);
    
    const cleanQuery = query.toLowerCase().replace(/[?.,!]/g, "");
    const queryWords = cleanQuery.split(/\s+/);
    const keywords = queryWords.filter(k => k.length > 1 && !stopWords.has(k));
    
    // Use keywords if they exist, otherwise use all non-empty words
    const searchTerms = keywords.length > 0 ? keywords : queryWords.filter(k => k.length > 0);

    if (searchTerms.length === 0) {
      return await Link.find({ user: req.user.id, title: new RegExp(query, "i") }).limit(50);
    }

    // 2. Build Query (Match ANY term)
    const searchCriteria = {
      $or: searchTerms.flatMap(k => [
        { title: new RegExp(k, "i") },
        { summary: new RegExp(k, "i") },
        { tags: new RegExp(k, "i") },
        { category: new RegExp(k, "i") },
        { note: new RegExp(k, "i") }
      ])
    };

    const filter = { 
      user: req.user.id,
      ...searchCriteria
    };

    const results = await Link.find(filter).limit(100);
    
    // 3. Human-like Ranking (Scoring)
    return results.sort((a, b) => {
      const getScore = (item) => {
        let score = 0;
        const titleLower = (item.title || "").toLowerCase();
        const summaryLower = (item.summary || "").toLowerCase();
        const tagsLower = (item.tags || []).map(t => t.toLowerCase());
        const categoryLower = (item.category || "").toLowerCase();
        
        // Boost exact phrase matches (Highest priority for human language)
        if (titleLower.includes(cleanQuery)) score += 60;
        if (summaryLower.includes(cleanQuery)) score += 30;

        searchTerms.forEach(k => {
          const kw = k.toLowerCase();
          // Title matches are high value
          if (titleLower.includes(kw)) score += 10;
          // Tag matches are very high value
          if (tagsLower.some(t => t.includes(kw))) score += 15;
          // Category matches
          if (categoryLower.includes(kw)) score += 8;
          // Summary matches
          if (summaryLower.includes(kw)) score += 3;
        });

        // Boost recently created items slightly
        const recencyDays = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (recencyDays < 7) score += 10; // New items this week get a nice boost

        return score;
      };
      return getScore(b) - getScore(a);
    }).slice(0, 50);
  };

  try {
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      const results = await performFallbackSearch();
      return res.send(results);
    }

    const userVaults = await Vault.find({ members: req.user.id });
    const vaultIds = userVaults.map(v => v._id);

    // Try Vector Search (Atlas only)
    try {
      const results = await Link.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 20
          }
        },
        {
          $match: {
            $or: [
              { user: new mongoose.Types.ObjectId(req.user.id) },
              { vault: { $in: vaultIds } }
            ]
          }
        }
      ]);

      if (results.length > 0) return res.send(results);

      // If vector search returned nothing, try keyword search
      const fallbackResults = await performFallbackSearch();
      res.send(fallbackResults);
    } catch (vectorErr) {
      console.log("[SEARCH] Vector search failed or not supported, falling back to keywords:", vectorErr.message);
      const results = await performFallbackSearch();
      res.send(results);
    }
  } catch (err) {
    console.error("[SEARCH] General search error:", err.message);
    const results = await performFallbackSearch();
    res.send(results);
  }
});

router.get("/spark", auth, async (req, res) => {
  try {
    const links = await Link.find({ user: req.user.id });
    if (links.length === 0) return res.status(404).send("No links found");
    res.send(links[Math.floor(Math.random() * links.length)]);
  } catch (err) { res.status(500).send("Error"); }
});

router.get("/", auth, async (req, res) => {
  try {
    const personalLinks = await Link.find({ user: req.user.id });
    const userVaults = await Vault.find({ members: req.user.id });
    const vaultLinks = await Link.find({ vault: { $in: userVaults.map(v => v._id) } });
    const uniqueLinks = Array.from(new Map([...personalLinks, ...vaultLinks].map(l => [l._id.toString(), l])).values());
    res.send(uniqueLinks);
  } catch (err) { res.status(500).send("Error"); }
});

router.get("/:id/read", auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    const content = await fetchReaderContent(link.url);
    res.send({ ...content, note: link.note });
  } catch (err) { res.status(500).send("Error"); }
});

// Manual Weekly Digest Trigger
router.post("/trigger-digest", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { generateWeeklyBrief } = require("../services/cronJobs");
    const { sendWeeklyDigest } = require("../services/emailService");
    
    const brief = await generateWeeklyBrief(user);
    if (!brief) return res.status(400).send("Not enough links this week to generate a digest.");
    
    await sendWeeklyDigest(user, brief);
    res.send({ msg: "Digest email sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send digest email.");
  }
});

// Get Stale Links (Older than 30 days)
router.get("/stale", auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const staleLinks = await Link.find({
      user: req.user.id,
      createdAt: { $lte: thirtyDaysAgo },
      isPinned: false // Don't cleanup pinned items
    });
    
    res.send(staleLinks);
  } catch (err) {
    res.status(500).send("Error fetching stale links");
  }
});

// Library Cleanup (Batch Delete)
router.post("/cleanup", auth, async (req, res) => {
  try {
    const { linkIds } = req.body;
    if (!Array.isArray(linkIds)) return res.status(400).send("Invalid input");
    
    await Link.deleteMany({
      _id: { $in: linkIds },
      user: req.user.id
    });
    
    // Invalidate cache
    const { redisClient } = require("../config/redis");
    if (redisClient.isOpen) {
      await redisClient.del(`analytics:${req.user.id}`);
    }
    
    res.send({ msg: `${linkIds.length} links removed from your library.` });
  } catch (err) {
    res.status(500).send("Cleanup failed");
  }
});

router.post("/:id/quiz", auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    const content = await fetchReaderContent(link.url);
    const quiz = await generateQuiz(link.url, link.title, content.textContent);
    res.send(quiz);
  } catch (err) { res.status(500).send("Error"); }
});

module.exports = router;
require("dotenv").config();
const mongoose = require("mongoose");
const Link = require("./models/Link");
const { generateEmbedding } = require("./services/aiService");

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected!");

    // Find links with empty or missing embeddings
    const links = await Link.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: null }
      ]
    });

    console.log(`Found ${links.length} links to process.`);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`[${i + 1}/${links.length}] Generating embedding for: ${link.title || link.url}`);
      
      try {
        const text = `Title: ${link.title} | Summary: ${link.summary} | Tags: ${link.tags?.join(", ")}`;
        const embedding = await generateEmbedding(text);
        
        if (embedding && embedding.length > 0) {
          link.embedding = embedding;
          await link.save();
          console.log(`✅ Saved embedding (${embedding.length} dimensions)`);
        } else {
          console.log(`⚠️ Failed to generate embedding for this link.`);
        }
      } catch (err) {
        console.error(`❌ Error processing link ${link._id}:`, err.message);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();

const { Redis } = require("@upstash/redis");

/**
 * UPSTASH REDIS CONFIGURATION (REST)
 * 
 * Choice B: This is the optimal configuration for Vercel/Serverless.
 * It uses HTTP instead of persistent TCP connections, preventing connection pooling issues.
 */

let redisClient;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Patch to match the standard redis library methods used in the app
    // The standard library uses .isOpen and .isReady, Upstash doesn't need these
    redisClient.isOpen = true;
    redisClient.isReady = true;
    
    // Add a helper for the setEx method used in the app
    // Standard redis: .setEx(key, seconds, value)
    // Upstash redis: .set(key, value, { ex: seconds })
    const originalSetEx = redisClient.setEx;
    redisClient.setEx = async (key, seconds, value) => {
      return await redisClient.set(key, value, { ex: seconds });
    };

    console.log("[REDIS] Upstash REST Client Initialized");
  } else {
    console.warn("[REDIS] Missing Upstash REST credentials. Caching is disabled.");
    // Mock client to prevent crashes
    redisClient = {
      get: async () => null,
      set: async () => null,
      setEx: async () => null,
      del: async () => null,
      isOpen: false,
      isReady: false
    };
  }
} catch (err) {
  console.error("[REDIS] Failed to initialize Upstash client:", err.message);
  redisClient = { isOpen: false, isReady: false };
}

module.exports = redisClient;

const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 3) return new Error("Redis connection failed");
      return Math.min(retries * 50, 500);
    }
  }
});

client.on("error", (err) => console.error("Redis Client Error", err.message));
client.on("connect", () => console.log("Redis Connected"));
client.on("ready", () => console.log("Redis Ready"));

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error("Initial Redis connection failed:", err.message);
  }
})();

module.exports = client;
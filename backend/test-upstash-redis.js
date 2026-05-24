const redisClient = require("./config/redis");
require("dotenv").config();

async function testUpstash() {
  console.log("--- STARTING UPSTASH REDIS TEST ---");
  
  if (!redisClient.isOpen) {
    console.error("Redis client is not open. Check your environment variables!");
    return;
  }

  try {
    const testKey = "test_ping";
    const testValue = "pong_" + Date.now();

    console.log(`Setting key: ${testKey} to: ${testValue}`);
    await redisClient.setEx(testKey, 60, testValue);

    console.log("Retrieving key...");
    const result = await redisClient.get(testKey);
    
    if (result === testValue) {
      console.log("SUCCESS: Redis set and get verified!");
    } else {
      console.error(`FAILURE: Expected ${testValue}, got ${result}`);
    }

  } catch (err) {
    console.error("Test failed with error:", err.message);
  }
}

testUpstash();

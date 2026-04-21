const mongoose = require("mongoose");
require("dotenv").config();
const Link = require("./models/Link");

async function testAnalytics() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const links = await Link.find({});
    console.log(`Total links in DB: ${links.length}`);

    const activityMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }
    console.log("Initial Activity Map:", JSON.stringify(activityMap, null, 2));

    links.forEach(l => {
      if (l.createdAt) {
        const dateStr = l.createdAt.toISOString().split('T')[0];
        console.log(`Link ID: ${l._id}, createdAt: ${l.createdAt}, dateStr: ${dateStr}`);
        if (activityMap.hasOwnProperty(dateStr)) {
          activityMap[dateStr]++;
        }
      } else {
        console.log(`Link ID: ${l._id} has NO createdAt!`);
      }
    });

    console.log("Final Activity Map:", JSON.stringify(activityMap, null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

testAnalytics();

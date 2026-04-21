const mongoose = require("mongoose");
require("dotenv").config();

async function checkDB() {
  try {
    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!\n");

    const admin = new mongoose.mongo.Admin(conn.connection.db);
    const dbs = await admin.listDatabases();
    console.log("--- DATABASES ---");
    dbs.databases.forEach(db => console.log(`- ${db.name}`));

    const currentDB = mongoose.connection.db.databaseName;
    console.log(`\nCurrent Database: ${currentDB}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("--- COLLECTIONS ---");
    
    for (let col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Connection Error:", err);
    process.exit(1);
  }
}

checkDB();

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://foodpoint_db:foodpoint_db@foodpint.otnysi6.mongodb.net/";

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log(`📊 Found ${collections.length} collections in database`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
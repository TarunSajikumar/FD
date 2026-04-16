const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://foodpoint_db:foodpoint_db@foodpint.otnysi6.mongodb.net/";

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log(`📍 URI: ${MONGO_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`); // Hide credentials

  try {
    // Set connection timeout
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000,
    });

    console.log('✅ Connected to MongoDB successfully!');

    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log(`📊 Found ${collections.length} collections in database`);

    // Get database info
    const dbStats = await db.stats();
    console.log(`💾 Database size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📄 Collections: ${collections.map(c => c.collectionName).join(', ') || 'none'}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('\n🎉 MongoDB is ready! You can now run: npm start');

  } catch (error) {
    console.error('\n❌ MongoDB connection failed:', error.message);

    // Provide specific troubleshooting based on error type
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('1. Check if MongoDB Atlas cluster is running');
      console.log('2. Verify IP whitelist in MongoDB Atlas dashboard');
      console.log('3. Ensure database user credentials are correct');
      console.log('4. Check network connectivity to MongoDB Atlas');
      console.log('5. Try connecting from MongoDB Compass with the same URI');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication failed:');
      console.log('1. Verify username/password in connection string');
      console.log('2. Check user permissions in MongoDB Atlas');
      console.log('3. Ensure user has read/write access to database');
    } else if (error.message.includes('querySrv')) {
      console.log('\n🔧 DNS resolution failed:');
      console.log('1. Check internet connection');
      console.log('2. Verify the cluster URL is correct');
      console.log('3. Try using a different DNS server');
    }

    console.log('\n💡 Alternative: Run with local storage fallback');
    console.log('   Set USE_LOCAL_STORAGE=true in .env to use file-based storage');

    process.exit(1);
  }
}

testConnection();
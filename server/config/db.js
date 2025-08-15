import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const MONGODB_URI = process.env.MONGODB_URI;
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined. Ensure it is set in your environment or .env file.');
      }
      
      // Check if we're in development and MongoDB is not available
      if (process.env.NODE_ENV === 'development' && MONGODB_URI.includes('mongodb.net')) {
        console.log('⚠️ Using MongoDB Atlas in development. If connection fails, consider using local MongoDB.');
      }
      
      // Enhanced MongoDB connection options to fix SSL/TLS issues
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        retryWrites: true,
        w: "majority",
        
        // Fix SSL/TLS issues - simplified configuration
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        
        // Fallback options for connection issues
        heartbeatFrequencyMS: 10000,
        localThresholdMS: 15,
        
        // Remove deprecated options
        // ssl: true,           // Deprecated
        // sslValidate: false,  // Deprecated
        // useNewUrlParser: true,      // Deprecated - default in Mongoose 6+
        // useUnifiedTopology: true,  // Deprecated - default in Mongoose 6+
      };

      console.log('🔌 Attempting to connect to MongoDB...');
      console.log('📡 Connection string:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      console.log('⚙️ Connection options:', JSON.stringify(options, null, 2));

      await mongoose.connect(MONGODB_URI, options);

      isConnected = true;
      console.log("✅ MongoDB Connected Successfully");
      console.log("📊 Database:", mongoose.connection.db.databaseName);
      console.log("🌐 Host:", mongoose.connection.host);
      console.log("🔌 Port:", mongoose.connection.port);
      return;
    } catch (error) {
      retryCount++;
      console.error(`❌ MongoDB Connection Error (Attempt ${retryCount}/${maxRetries}):`, error.message);
      
      // Provide helpful error messages for specific error types
      if (error.message.includes('ECONNREFUSED')) {
        console.error("💡 Make sure MongoDB is running locally or check your connection string");
        console.error("💡 For local MongoDB: mongodb://127.0.0.1:27017/tasknest");
        console.error("💡 For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/tasknest");
      }
      
      if (error.message.includes('SSL') || error.message.includes('TLS')) {
        console.error("🔒 SSL/TLS Connection Error detected");
        console.error("💡 Try updating your MongoDB connection string to include proper SSL parameters");
        console.error("💡 Example: mongodb+srv://username:password@cluster.mongodb.net/tasknest?retryWrites=true&w=majority&tls=true");
        console.error("💡 Or use local MongoDB for development: mongodb://127.0.0.1:27017/tasknest");
      }
      
      if (error.message.includes('authentication')) {
        console.error("🔑 Authentication Error - Check your username and password");
        console.error("💡 Ensure your MongoDB Atlas user has proper permissions");
      }
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error("❌ Failed to connect to MongoDB after all retries");
        console.error("💡 Please check your MongoDB connection and try again");
        isConnected = false;
        throw error;
      }
    }
  }
}

export { mongoose };

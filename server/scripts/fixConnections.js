import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Connection } from '../models/connection.js';

// Load environment variables
dotenv.config();

const fixConnections = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find and remove connections with null values
    const nullConnections = await Connection.find({
      $or: [
        { requesterEmail: null },
        { recipientEmail: null },
        { requesterId: null },
        { recipientId: null }
      ]
    });

    console.log(`Found ${nullConnections.length} connections with null values`);

    if (nullConnections.length > 0) {
      await Connection.deleteMany({
        $or: [
          { requesterEmail: null },
          { recipientEmail: null },
          { requesterId: null },
          { recipientId: null }
        ]
      });
      console.log('✅ Removed connections with null values');
    }

    // Drop the old index if it exists
    try {
      await Connection.collection.dropIndex('requesterId_1_recipientId_1');
      console.log('✅ Dropped old index');
    } catch (error) {
      console.log('ℹ️ Old index not found or already dropped');
    }

    // Create the new index
    await Connection.collection.createIndex(
      { requesterEmail: 1, recipientEmail: 1 }, 
      { unique: true }
    );
    console.log('✅ Created new index on requesterEmail and recipientEmail');

    console.log('✅ Database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

fixConnections();
